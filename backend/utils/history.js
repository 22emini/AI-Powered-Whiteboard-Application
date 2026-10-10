import { prisma } from "../src/config/db.js";
import { emitToBoard } from "../src/config/socket.js";

// Per-user, per-board history. Kept in memory (cleared on server restart).
// Each entry: { kind: "create" | "update" | "delete", before?, after? }
//   create: after = element         update: before/after = element snapshots
//   delete: before = element
const MAX_HISTORY = 100;
const histories = new Map();

const key = (boardId, userId) => `${boardId}:${userId}`;

const getHistory = (boardId, userId) => {
    const k = key(boardId, userId);
    if (!histories.has(k)) histories.set(k, { undo: [], redo: [] });
    return histories.get(k);
};

// Call after a user's own change. A new action invalidates the redo stack.
export const recordAction = (boardId, userId, action) => {
    const h = getHistory(boardId, userId);
    h.undo.push(action);
    if (h.undo.length > MAX_HISTORY) h.undo.shift();
    h.redo = [];
};

export const getHistoryState = (boardId, userId) => {
    const h = getHistory(boardId, userId);
    return { canUndo: h.undo.length > 0, canRedo: h.redo.length > 0 };
};

const snapshotFields = (el) => ({ x: el.x, y: el.y, data: el.data });

// Create (or restore) an element with its original id
const restore = async (boardId, el) => {
    const existing = await prisma.element.findUnique({ where: { id: el.id } });
    if (existing) return existing;
    const created = await prisma.element.create({
        data: { id: el.id, boardId, type: el.type, x: el.x, y: el.y, data: el.data },
    });
    emitToBoard(boardId, "element:created", created);
    return created;
};

const remove = async (boardId, el) => {
    const existing = await prisma.element.findUnique({ where: { id: el.id } });
    if (!existing) return null;
    await prisma.element.delete({ where: { id: el.id } });
    emitToBoard(boardId, "element:deleted", { id: el.id });
    return existing;
};

const setState = async (boardId, el) => {
    const existing = await prisma.element.findUnique({ where: { id: el.id } });
    if (!existing) return null;
    const updated = await prisma.element.update({
        where: { id: el.id },
        data: snapshotFields(el),
    });
    emitToBoard(boardId, "element:updated", updated);
    return updated;
};

// direction "undo" reverses the action, "redo" re-applies it
const apply = async (boardId, action, direction) => {
    const undoing = direction === "undo";
    switch (action.kind) {
        case "create":
            return undoing ? remove(boardId, action.after) : restore(boardId, action.after);
        case "delete":
            return undoing ? restore(boardId, action.before) : remove(boardId, action.before);
        case "update":
            return setState(boardId, undoing ? action.before : action.after);
    }
};

const step = async (boardId, userId, from, to, direction) => {
    const h = getHistory(boardId, userId);
    while (h[from].length) {
        const action = h[from].pop();
        const result = await apply(boardId, action, direction);
        // skip actions that no longer apply (e.g. element deleted by someone else)
        if (result) {
            h[to].push(action);
            return { applied: action.kind, ...getHistoryState(boardId, userId) };
        }
    }
    return null;
};

export const undo = (boardId, userId) => step(boardId, userId, "undo", "redo", "undo");
export const redo = (boardId, userId) => step(boardId, userId, "redo", "undo", "redo");
