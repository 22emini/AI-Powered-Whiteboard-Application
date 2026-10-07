import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getBoardRole, canView } from "../../utils/boardAccess.js";

let io = null;

const roomName = (boardId) => `board:${boardId}`;

export const initSocket = (httpServer) => {
    const rawOrigin = process.env.FRONTEND_URL;
    const origins = rawOrigin
        ? rawOrigin.split(",").map((s) => s.trim().replace(/\/$/, ""))
        : "*";

    io = new Server(httpServer, {
        cors: {
            origin: origins.length === 1 ? origins[0] : origins,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // Every socket must present a valid JWT: io({ auth: { token } })
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Login required"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        // Client asks to join a board room (only if they have access)
        socket.on("board:join", async (boardId, ack) => {
            try {
                const role = await getBoardRole(boardId, socket.userId);
                if (!canView(role)) {
                    return ack?.({ ok: false, message: "Board not found" });
                }
                socket.join(roomName(boardId));
                socket.to(roomName(boardId)).emit("user:joined", { userId: socket.userId });
                ack?.({ ok: true, role });
            } catch (error) {
                console.log(error);
                ack?.({ ok: false, message: "Could not join board" });
            }
        });

        socket.on("board:leave", (boardId) => {
            socket.leave(roomName(boardId));
            socket.to(roomName(boardId)).emit("user:left", { userId: socket.userId });
        });

        // Live cursors: relayed to everyone else in the room, never saved
        socket.on("cursor:move", ({ boardId, x, y }) => {
            if (!socket.rooms.has(roomName(boardId))) return;
            socket.to(roomName(boardId)).emit("cursor:move", {
                userId: socket.userId,
                x,
                y,
            });
        });

        socket.on("disconnecting", () => {
            for (const room of socket.rooms) {
                if (room.startsWith("board:")) {
                    socket.to(room).emit("user:left", { userId: socket.userId });
                }
            }
        });
    });

    return io;
};

// Called by the REST controllers after they change data.
// Safe to call even if sockets are not running.
export const emitToBoard = (boardId, event, payload) => {
    if (!io) return;
    io.to(roomName(boardId)).emit(event, payload);
};
