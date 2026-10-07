import express from "express";
import dotenv from "dotenv"
import cors from "cors";
import { prisma } from "./src/config/db.js";
dotenv.config()
import boardsRouter from "./routes/boardRoutes.js";
import authRoutes from "./routes/UserAuthRoute.js";
import elementRoutes from "./routes/elementRoute.js";
import memberRoutes from "./routes/memberRoute.js";
import aiRoutes from "./routes/aiRoute.js";
import uploadRoutes from "./routes/uploadRoute.js";
import http from "http";
import { initSocket } from "./src/config/socket.js";
import { UPLOAD_DIR } from "./service/storage.js";


const app = express();
const PORT= process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
// uploaded images (file names are random UUIDs)
app.use("/uploads", express.static(UPLOAD_DIR));



app.get("/health", (req, res) => {
    res.status(200).json({
        message: "hey man your backend is running"
    });
    console.log(`status: "ok"`);
})
app.get("/", (req, res) => {
    res.status(200).send(
        "<h1>Welcome to root server</h1>"
    )
    
})

//endpoint to database Url
app.get("/db-test", async (req, res) => {
    try {
        const result = await prisma.$queryRaw`SELECT version()`;
        res.json(result);
        console.log("Database connected successfully",result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database connection failed" });
    }
});

app.use("/api/boards", boardsRouter);
app.use("/api/auth", authRoutes);
app.use("/api", elementRoutes);
app.use("/api", memberRoutes);
app.use("/api", aiRoutes);
app.use("/api", uploadRoutes);

// unknown URL -> JSON 404 (instead of Express's HTML page)
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// last-resort error handler (bad JSON bodies, unexpected throws)
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body is not valid JSON" });
    }
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
});

// Socket.IO needs the raw http server, not just the Express app
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
    console.log(`server is running on  http://localhost:${PORT}`);
})
