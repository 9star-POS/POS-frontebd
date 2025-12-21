import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const isInitialConnectionRef = useRef(true);

  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io.connect(
      import.meta.env.VITE_APP_API || import.meta.env.VITE_API_URL,
      {
        transports: ["websocket"],
        secure: true,
      }
    );

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      // console.log("Socket.IO connected");
      setIsConnected(true);
      // Only show toast on initial connection, not on every page navigation
      if (isInitialConnectionRef.current) {
        toast.success("Connected to notification service");
        isInitialConnectionRef.current = false;
      }
    });

    socket.on("disconnect", () => {
      // console.log("Socket.IO disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      // console.error("Socket.IO connection error:", error);
      setIsConnected(false);
    });

    // Listen for "new-notification" event
    socket.on("new-notification", (data) => {
      // console.log("data", data);
      try {
        const notification = {
          id: data.notificationId || Date.now() + Math.random(),
          message: data.message || "New Notification",
          createdAt: data.createdAt || new Date().toISOString(),
          read: data.isRead || false,
          orderFrom: data.orderFrom || "",
          orderItemStatus: data.orderItemStatus || "",
          metadata: data.metadata || {},
        };

        setNotifications((prev) => [notification, ...prev]);
        if (!notification.read) {
          setUnreadCount((prev) => prev + 1);
        }

        // Show toast notification
        toast.info(notification.message, {
          duration: 5000,
        });
      } catch (error) {
        // console.error("Error processing notification:", error);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
