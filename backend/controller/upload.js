import { prisma } from "../src/config/db.js";
import { getBoardRole, canView, canEdit } from "../utils/boardAccess.js";
import { emitToBoard } from "../src/config/socket.js";
import { processUpload } from "../service/storage.js";

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
            return res.status(404).json({ message: "Board not found" });
        }
        if (!canEdit(role)) {
            return res.status(403).json({ message: "You have view-only access" });
        }

        const x = Number(req.body.x);
        const y = Number(req.body.y);

        const uploaded = await processUpload(req.file, req);

        const element = await prisma.element.create({
            data: {
                boardId,
                type: "image",
                x: Number.isFinite(x) ? x : 100,
                y: Number.isFinite(y) ? y : 100,
                data: {
                    url: uploaded.url,
                    publicId: uploaded.publicId,
                    filename: uploaded.filename,
                    originalName: uploaded.originalName,
                    mimeType: uploaded.mimeType,
                    size: uploaded.size,
                    storage: uploaded.storage,
                },
            },
        });

        emitToBoard(boardId, "element:created", element);
        res.status(201).json({ message: "Image uploaded", result: element });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Could not upload image" });
    }
};
