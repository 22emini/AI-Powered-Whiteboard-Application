import express from "express";
import dotenv from "dotenv"
import cors from "cors";
import { prisma } from "./src/config/db.js";
dotenv.config()

const app = express();
const PORT= process.env.PORT || 5000;

app.use(express.json());
app.use(cors());



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


app.listen(PORT, () => {
    console.log(`server is running on  http://localhost:${PORT}`);
})



