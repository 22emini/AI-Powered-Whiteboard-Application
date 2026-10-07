import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { AddMember, GetMembers, RemoveMember } from "../controller/member.js";

const router = express.Router();

router.post("/boards/:boardId/members", requireAuth, AddMember);
router.get("/boards/:boardId/members", requireAuth, GetMembers);
router.delete("/boards/:boardId/members/:userId", requireAuth, RemoveMember);

export default router;
