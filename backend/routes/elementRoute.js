import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { CreateElement, GetBoardElements, UpdateElement, DeleteElement } from "../controller/element.js";

const router = express.Router();

router.post("/boards/:boardId/elements", requireAuth, CreateElement);
router.get("/boards/:boardId/elements", requireAuth, GetBoardElements);
router.patch("/elements/:id", requireAuth, UpdateElement);
router.delete("/elements/:id", requireAuth, DeleteElement);

export default router;
