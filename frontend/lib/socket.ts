import { io, type Socket } from "socket.io-client";
import { API_URL, tokenStore } from "./api";

export function connectSocket(): Socket {
  return io(API_URL, { auth: { token: tokenStore.get() }, transports: ["websocket", "polling"] });
}
