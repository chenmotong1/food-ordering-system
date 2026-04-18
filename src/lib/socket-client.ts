"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useState, useCallback, useRef } from "react";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      autoConnect: false,
    });
  }
  return socket;
}

export interface NewOrderNotification {
  id: string;
  orderNo: string;
  pickupNo: string;
  totalPrice: number;
  orderTime: string;
  itemCount: number;
}

// Hook: admin real-time notifications
export function useAdminNotification() {
  const [notifications, setNotifications] = useState<NewOrderNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    if (!s.connected) s.connect();
    s.emit("join_admin_room");

    const handler = (data: NewOrderNotification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 20));
    };

    s.on("new_order", handler);

    return () => {
      s.off("new_order", handler);
    };
  }, []);

  const dismissNotification = useCallback((orderNo: string) => {
    setNotifications((prev) => prev.filter((n) => n.orderNo !== orderNo));
  }, []);

  return { notifications, dismissNotification };
}

// Hook: customer order status tracking
export function useOrderStatus(userId: string | undefined) {
  const [status, setStatus] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const s = getSocket();
    socketRef.current = s;

    if (!s.connected) s.connect();
    s.emit("join_order_room", userId);

    const handler = (data: { orderId: string; status: string; estimatedTime?: string }) => {
      setStatus(data.status);
      if (data.estimatedTime) setEstimatedTime(data.estimatedTime);
    };

    s.on("order_updated", handler);

    return () => {
      s.off("order_updated", handler);
    };
  }, [userId]);

  return { status, estimatedTime };
}
