import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("join_order_room", (userId: string) => {
      socket.join(`order_${userId}`);
      console.log(`[Socket] ${socket.id} joined order_${userId}`);
    });

    socket.on("join_admin_room", () => {
      socket.join("admin");
      console.log(`[Socket] ${socket.id} joined admin room`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export function notifyNewOrder(orderData: Record<string, unknown>) {
  try {
    const socketIO = getIO();
    socketIO.to("admin").emit("new_order", orderData);
  } catch {
    // Socket not initialized, skip notification
  }
}

export function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  status: string
) {
  try {
    const socketIO = getIO();
    socketIO.to(`order_${userId}`).emit("order_updated", { orderId, status });
  } catch {
    // Socket not initialized, skip notification
  }
}
