import { prisma } from "../src/config/db.js";
import { getBoardRole } from "../utils/boardAccess.js";

const VALID_ROLES = ["viewer", "editor"];

// Share a board with another user (owner only)
export const AddMember = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Member email is required" });
        }
        const memberRole = role || "editor";
        if (!VALID_ROLES.includes(memberRole)) {
            return res.status(400).json({ message: "Role must be viewer or editor" });
        }

        const myRole = await getBoardRole(boardId, req.userId);
        if (myRole === null) {
            return res.status(404).json({ message: "Board not found" });
        }
        if (myRole !== "owner") {
            return res.status(403).json({ message: "Only the owner can share this board" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "No user with that email" });
        }
        if (user.id === req.userId) {
            return res.status(400).json({ message: "You already own this board" });
        }

        // upsert: add the member, or just change their role if already added
        const member = await prisma.boardMember.upsert({
            where: { boardId_userId: { boardId, userId: user.id } },
            update: { role: memberRole },
            create: { boardId, userId: user.id, role: memberRole },
        });

        res.status(201).json({ message: "Member added", result: member });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not add member" });
    }
};

// List who has access (owner and members can see this)
export const GetMembers = async (req, res) => {
    try {
        const { boardId } = req.params;

        const myRole = await getBoardRole(boardId, req.userId);
        if (myRole === null) {
            return res.status(404).json({ message: "Board not found" });
        }

        const members = await prisma.boardMember.findMany({
            where: { boardId },
            include: { user: { select: { id: true, email: true, name: true } } },
        });

        res.status(200).json({ message: "Success", result: members });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not get members" });
    }
};

// Remove a member (owner only)
export const RemoveMember = async (req, res) => {
    try {
        const { boardId, userId } = req.params;

        const myRole = await getBoardRole(boardId, req.userId);
        if (myRole === null) {
            return res.status(404).json({ message: "Board not found" });
        }
        if (myRole !== "owner") {
            return res.status(403).json({ message: "Only the owner can remove members" });
        }

        const result = await prisma.boardMember.deleteMany({
            where: { boardId, userId },
        });
        if (result.count === 0) {
            return res.status(404).json({ message: "Member not found" });
        }

        res.status(204).send();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not remove member" });
    }
};
