import jwt from "jsonwebtoken";
import { prisma } from "../src/config/db.js";

export const requireAuth = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Login required" });
    }

    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Login required" });
    }

    try {
        // 1. Check Better Auth active session in Postgres
        const session = await prisma.session.findUnique({
            where: { token },
            select: { userId: true, expiresAt: true },
        });

        if (session && new Date(session.expiresAt) > new Date()) {
            req.userId = session.userId;
            return next();
        }

        // 2. Fallback to JWT verification (legacy JWT or signed Better Auth token)
        const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;
        if (secret) {
            try {
                const decoded = jwt.verify(token, secret);
                req.userId = decoded.userId || decoded.sub;
                return next();
            } catch {
                // fall through to 401 below
            }
        }

        return res.status(401).json({ message: "Invalid or expired token" });
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
