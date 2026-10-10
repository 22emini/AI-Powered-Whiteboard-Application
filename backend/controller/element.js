import { prisma } from "../src/config/db.js";
import { getBoardRole, canView, canEdit } from "../utils/boardAccess.js";
import { emitToBoard } from "../src/config/socket.js";
import { deleteFromStorage } from "../service/storage.js";
import { recordAction, undo, redo, getHistoryState } from "../utils/history.js";

export const CreateElement = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { type, x, y, data } = req.body;

        if (!type || x === undefined || y === undefined || !data) {
            return res.status(400).json({ message: "type, x, y and data are required" });
        }

        // owner and editors may add elements
        const role = await getBoardRole(boardId, req.userId);
        if (!canView(role)) {
            return res.status(404).json({ message: "Board not found" });
        }
        if (!canEdit(role)) {
            return res.status(403).json({ message: "You have view-only access" });
        }

        const element = await prisma.element.create({
            data: { boardId, type, x, y, data },
        });

        recordAction(boardId, req.userId, { kind: "create", after: element });
        emitToBoard(boardId, "element:created", element);
        res.status(201).json({ message: "Element created", result: element });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not create element" });
    }
};

export const GetBoardElements = async (req, res) => {
    try {
        const { boardId } = req.params;

        const role = await getBoardRole(boardId, req.userId);
        if (!canView(role)) {
            return res.status(404).json({ message: "Board not found" });
        }

        const elements = await prisma.element.findMany({ where: { boardId } });
        res.status(200).json({ message: "Success", result: elements });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not get elements" });
    }
};

export const UpdateElement = async (req, res) => {
    try {
        const { x, y, data } = req.body;

        const existing = await prisma.element.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ message: "Element not found" });
        }

        const role = await getBoardRole(existing.boardId, req.userId);
        if (!canView(role)) {
            return res.status(404).json({ message: "Element not found" });
        }
        if (!canEdit(role)) {
            return res.status(403).json({ message: "You have view-only access" });
        }

        const element = await prisma.element.update({
            where: { id: req.params.id },
            data: { x, y, data },
        });

        recordAction(existing.boardId, req.userId, { kind: "update", before: existing, after: element });
        emitToBoard(existing.boardId, "element:updated", element);
        res.status(200).json({ message: "Element updated", result: element });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not update element" });
    }
};

export const DeleteElement = async (req, res) => {
    try {
        const existing = await prisma.element.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ message: "Element not found" });
        }

        const role = await getBoardRole(existing.boardId, req.userId);
        if (!canView(role)) {
            return res.status(404).json({ message: "Element not found" });
        }
        if (!canEdit(role)) {
            return res.status(403).json({ message: "You have view-only access" });
        }

        await prisma.element.delete({ where: { id: req.params.id } });

        // keep uploaded image file so a delete can be undone
        recordAction(existing.boardId, req.userId, { kind: "delete", before: existing });

        emitToBoard(existing.boardId, "element:deleted", { id: existing.id });
        res.status(204).send();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not delete element" });
    }
};

const editorOnly = async (req, res) => {
    const { boardId } = req.params;
    const role = await getBoardRole(boardId, req.userId);
    if (!canView(role)) {
        res.status(404).json({ message: "Board not found" });
        return false;
    }
    if (!canEdit(role)) {
        res.status(403).json({ message: "You have view-only access" });
        return false;
    }
    return true;
};

export const UndoAction = async (req, res) => {
    try {
        if (!(await editorOnly(req, res))) return;
        const result = await undo(req.params.boardId, req.userId);
        if (!result) return res.status(409).json({ message: "Nothing to undo" });
        res.status(200).json({ message: "Undone", result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not undo" });
    }
};

export const RedoAction = async (req, res) => {
    try {
        if (!(await editorOnly(req, res))) return;
        const result = await redo(req.params.boardId, req.userId);
        if (!result) return res.status(409).json({ message: "Nothing to redo" });
        res.status(200).json({ message: "Redone", result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not redo" });
    }
};

export const GetHistoryState = async (req, res) => {
    try {
        const role = await getBoardRole(req.params.boardId, req.userId);
        if (!canView(role)) return res.status(404).json({ message: "Board not found" });
        res.status(200).json({ message: "Success", result: getHistoryState(req.params.boardId, req.userId) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not get history" });
    }
};
