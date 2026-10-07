import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../service/storage.js";
import { UploadImage } from "../controller/upload.js";

const router = express.Router();

// wrap multer so file errors (too big, wrong type) become clean 400 responses
const handleUpload = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (error) {
            const message =
                error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : error.message;
            return res.status(400).json({ message });
        }
        next();
    });
};

router.post("/boards/:boardId/uploads", requireAuth, handleUpload, UploadImage);

export default router;
