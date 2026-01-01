import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { isWaiter } from "../utils/getUserRole";

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
  const audioRef = useRef(null);

  // Custom notification sound file path
  // Place your custom sound file in the public folder and update this path
  // Supported formats: .mp3, .wav, .ogg, .m4a
  // Example: "/notification.mp3" or "/sounds/notification.wav"
  const customSoundPath = "/soung.wav"; // Change this to your custom sound file path

  // Initialize audio element for custom sound
  useEffect(() => {
    if (customSoundPath) {
      const audio = new Audio(customSoundPath);
      audio.preload = "auto";
      audio.volume = 0.7; // Set volume (0.0 to 1.0)
      audioRef.current = audio;
    }
  }, []);

  // Play notification sound when new notifications arrive
  // Only plays sound for ktv-waiter and restaurant-waiter roles
  const playNotificationSound = () => {
    // Check if user is a waiter before playing sound
    if (!isWaiter()) {
      return;
    }

    try {
      // Try to play custom sound file first
      if (audioRef.current && customSoundPath) {
        // Reset audio to start from beginning
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.warn("Error playing custom notification sound:", error);
          // Fall back to generated sound if custom sound fails
          playGeneratedSound();
        });
        return;
      }

      // Fall back to generated sound if no custom sound is configured
      playGeneratedSound();
    } catch (error) {
      console.error("Error playing notification sound:", error);
      // Fall back to generated sound on error
      playGeneratedSound();
    }
  };

  // Play generated notification sound (fallback)
  const playGeneratedSound = () => {
    try {
      // Use bracket notation to avoid TypeScript errors for webkitAudioContext
      const AudioContextClass =
        window.AudioContext || window["webkitAudioContext"];
      if (!AudioContextClass) {
        console.warn("AudioContext not supported in this browser");
        return;
      }
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set a pleasant notification tone (800 Hz)
      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      // Fade in and out for a pleasant sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.1
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error("Error playing generated notification sound:", error);
    }
  };

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

        // Play notification sound
        playNotificationSound();

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
