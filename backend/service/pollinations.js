import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR, fileUrl } from "./storage.js";

/**
 * Generates an image using Pollinations AI (free, no API key needed).
 * Saves it to the local uploads directory and returns an element-ready object.
 */
export const generatePollinationsImage = async (req, prompt) => {
    const seed = Math.floor(Math.random() * 1000000);
    // Request a clean square illustration/image
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&seed=${seed}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
        const response = await fetch(pollinationsUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Image generation failed with status ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filename = `${crypto.randomUUID()}.jpg`;
        const filepath = path.join(UPLOAD_DIR, filename);

        await fs.writeFile(filepath, buffer);

        return {
            url: fileUrl(req, filename),
            originalName: `${prompt.slice(0, 30)}.jpg`,
            mimeType: "image/jpeg",
            size: buffer.length,
            width: 380,
            height: 380,
        };
    } catch (error) {
        clearTimeout(timeout);
        // Fallback: if saving fails or network timed out writing disk, use direct URL
        if (error.name !== "AbortError") {
            return {
                url: pollinationsUrl,
                originalName: `${prompt.slice(0, 30)}.jpg`,
                mimeType: "image/jpeg",
                size: 0,
                width: 380,
                height: 380,
            };
        }
        throw new Error("Image generation timed out. Please try again.");
    }
};
