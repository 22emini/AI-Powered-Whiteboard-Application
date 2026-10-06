import express from "express";
import { SignUp, Login } from "../controller/User.js";

const router = express.Router();

router.post("/signup", SignUp);
router.post("/login", Login);

export default router;
