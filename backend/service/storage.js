import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Images are stored on local disk in backend/uploads and served at /uploads/<file>.
// Everything storage-related lives in this file, so moving to Neon Object Storage
// (or any S3-compatible bucket) later only means changing this file.

export const UPLOAD_DIR = path.resolve("uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        // random name: never trust the user's file name
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${ext}`);
    },
});

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(new Error("Only png, jpeg, gif or webp images are allowed"));
        }
        cb(null, true);
    },
});

// public URL for a stored file
export const fileUrl = (req, filename) =>
    `${req.protocol}://${req.get("host")}/uploads/${filename}`;
