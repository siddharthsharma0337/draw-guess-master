import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In production, VITE_SOCKET_URL points to the Railway/Render backend.
    // In local dev, we connect to the same origin (proxied by Vite to port 3001).
    const base = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;
    socket = io(base, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
