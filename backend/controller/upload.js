import fs from "fs";
import { prisma } from "../src/config/db.js";
import { getBoardRole, canView, canEdit } from "../utils/boardAccess.js";
import { emitToBoard } from "../src/config/socket.js";
import { fileUrl } from "../service/storage.js";

const removeFile = (file) => {
    if (file) fs.unlink(file.path, () => {});
};

// POST /api/boards/:boardId/uploads  (multipart/form-data)
// fields: image (file), x?, y?
export const UploadImage = async (req, res) => {
    try {
        const { boardId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "Send an image in the 'image' field" });
        }

        const role = await getBoardRole(boardId, req.userId);
        if (!canView(role)) {
            removeFile(req.file);
            return res.status(404).json({ message: "Board not found" });
        }
        if (!canEdit(role)) {
            removeFile(req.file);
            return res.status(403).json({ message: "You have view-only access" });
        }

        const x = Number(req.body.x);
        const y = Number(req.body.y);

        const element = await prisma.element.create({
            data: {
                boardId,
                type: "image",
                x: Number.isFinite(x) ? x : 100,
                y: Number.isFinite(y) ? y : 100,
                data: {
                    url: fileUrl(req, req.file.filename),
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                },
            },
        });

        emitToBoard(boardId, "element:created", element);
        res.status(201).json({ message: "Image uploaded", result: element });
    } catch (error) {
        removeFile(req.file);
        console.log(error);
        res.status(500).json({ message: "Could not upload image" });
    }
};
