import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { CreateElement, GetBoardElements, UpdateElement, DeleteElement, UndoAction, RedoAction, GetHistoryState } from "../controller/element.js";

const router = express.Router();

router.post("/boards/:boardId/elements", requireAuth, CreateElement);
router.get("/boards/:boardId/elements", requireAuth, GetBoardElements);
router.patch("/elements/:id", requireAuth, UpdateElement);
router.delete("/elements/:id", requireAuth, DeleteElement);
router.post("/boards/:boardId/undo", requireAuth, UndoAction);
router.post("/boards/:boardId/redo", requireAuth, RedoAction);
router.get("/boards/:boardId/history", requireAuth, GetHistoryState);

export default router;
