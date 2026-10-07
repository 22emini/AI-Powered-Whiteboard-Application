import express from "express";
import { SignUp, Login, ForgotPassword, ResetPassword } from "../controller/User.js";

const router = express.Router();

router.post("/signup", SignUp);
router.post("/login", Login);
router.post("/forgot-password", ForgotPassword);
router.post("/reset-password", ResetPassword);

export default router;
