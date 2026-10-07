import express from "express";
import {GetAllBoards,GetById,UpdateBoard,DeleteBoard,CreateBoard} from "../controller/board.js"
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);
router.get("/",GetAllBoards);
router.get("/:id",GetById);
router.post("/",requireAuth,CreateBoard);
router.patch("/:id",requireAuth,UpdateBoard);
router.delete("/:id",DeleteBoard);



export default router;
