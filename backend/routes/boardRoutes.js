import express from "express";
import {GetAllBoards,GetById,UpdateBoard,DeleteBoard,CreateBoard} from "../controller/board.js"

const router = express.Router();
router.get("/",GetAllBoards);
router.get("/:id",GetById);
router.post("/",CreateBoard);
router.patch("/:id",UpdateBoard);
router.delete("/:id",DeleteBoard);


export default router;
