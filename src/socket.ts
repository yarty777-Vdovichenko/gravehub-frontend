import { io, type Socket } from "socket.io-client";
import { getAccessToken, refresh } from "./api";

export function createChatSocket(initialToken: string): Socket {
  const socket = io(import.meta.env.VITE_API_URL, {
    auth: (callback) => callback({ token: getAccessToken() ?? initialToken }),
    withCredentials: true,
  });
  socket.on("connect_error", (error) => {
    if (error.message === "unauthorized") void refresh().catch(() => {});
  });
  return socket;
}