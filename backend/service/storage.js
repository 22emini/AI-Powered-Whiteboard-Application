import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

export const UPLOAD_DIR = path.resolve("uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export const isCloudinaryConfigured = () => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    return Boolean(
        CLOUDINARY_CLOUD_NAME &&
        !CLOUDINARY_CLOUD_NAME.includes("your_") &&
        !CLOUDINARY_CLOUD_NAME.includes("xxxx") &&
        CLOUDINARY_API_KEY &&
        !CLOUDINARY_API_KEY.includes("your_") &&
        !CLOUDINARY_API_KEY.includes("xxxx") &&
        CLOUDINARY_API_SECRET &&
        !CLOUDINARY_API_SECRET.includes("your_") &&
        !CLOUDINARY_API_SECRET.includes("xxxx")
    );
};

if (isCloudinaryConfigured()) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}

// Multer in-memory storage so we can stream to Cloudinary or disk without double I/O
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(new Error("Only png, jpeg, gif or webp images are allowed"));
        }
        cb(null, true);
    },
});

function uploadToCloudinary(buffer, originalname) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "syntheboard",
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
}

/**
 * Process uploaded file:
 * - If Cloudinary is configured, uploads directly to Cloudinary and returns secure CDN URL.
 * - Otherwise (or on Cloudinary error), gracefully saves to local disk in UPLOAD_DIR.
 */
export async function processUpload(file, req) {
    if (isCloudinaryConfigured()) {
        try {
            const result = await uploadToCloudinary(file.buffer, file.originalname);
            return {
                url: result.secure_url,
                publicId: result.public_id,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                storage: "cloudinary",
            };
        } catch (cloudErr) {
            console.warn("[Cloudinary] Upload failed, falling back to local storage:", cloudErr.message);
        }
    }

    // Fallback: local disk
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.promises.writeFile(filePath, file.buffer);

    return {
        url: `${req.protocol}://${req.get("host")}/uploads/${filename}`,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storage: "local",
    };
}

/**
 * Remove an image from storage (Cloudinary or local disk)
 */
export async function deleteFromStorage(data) {
    if (!data) return;

    if (data.publicId && isCloudinaryConfigured()) {
        try {
            await cloudinary.uploader.destroy(data.publicId);
        } catch (err) {
            console.warn("[Cloudinary] Failed to delete image:", err.message);
        }
    } else if (data.filename) {
        try {
            const filePath = path.join(UPLOAD_DIR, data.filename);
            await fs.promises.unlink(filePath);
        } catch {
            // Ignore if file was already removed
        }
    }
}

// Backward compatibility helper
export const fileUrl = (req, filename) =>
    `${req.protocol}://${req.get("host")}/uploads/${filename}`;
