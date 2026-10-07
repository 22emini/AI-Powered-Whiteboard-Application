import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { GenerateWithAI } from "../controller/ai.js";

const router = express.Router();

router.post("/boards/:boardId/ai/generate", requireAuth, GenerateWithAI);

export default router;
