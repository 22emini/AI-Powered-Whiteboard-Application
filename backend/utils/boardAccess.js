import { prisma } from "../src/config/db.js";

// Returns "owner", "editor", "viewer", or null (no access / board not found)
export const getBoardRole = async (boardId, userId) => {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: {
            ownerId: true,
            members: { where: { userId: userId }, select: { role: true } },
        },
    });

    if (!board) return null;
    if (board.ownerId === userId) return "owner";
    if (board.members.length > 0) return board.members[0].role;
    return null;
};

export const canView = (role) => role !== null;
export const canEdit = (role) => role === "owner" || role === "editor";
