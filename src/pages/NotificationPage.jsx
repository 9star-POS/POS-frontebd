import React, { useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useNotifications } from "../contexts/NotificationContext";
import { canEdit } from "../utils/getUserRole";

const NotificationPage = () => {
  const {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const previousNotificationsRef = useRef(new Set());

  // Play notification sound when new orders arrive
  const playNotificationSound = () => {
    console.log("Playing notification sound");
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
      console.error("Error playing notification sound:", error);
    }
  };

  // Play sound when new notifications arrive
  useEffect(() => {
    if (notifications.length === 0) {
      previousNotificationsRef.current.clear();
      return;
    }

    // Get current notification IDs
    const currentNotificationIds = new Set(notifications.map((n) => n.id));

    // Find new notifications (not in previous set)
    const newNotifications = notifications.filter(
      (n) => !previousNotificationsRef.current.has(n.id)
    );

    // Play sound for new notifications
    if (newNotifications.length > 0) {
      playNotificationSound();
    }

    // Update the ref with current notification IDs
    previousNotificationsRef.current = currentNotificationIds;
  }, [notifications]);

  const getNotificationIcon = (orderItemStatus) => {
    switch (orderItemStatus) {
      case "ready":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
      case "danger":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const formatNotificationTime = (timestamp) => {
    try {
      if (!timestamp) {
        return "Unknown time";
      }

      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return timestamp; // Return original timestamp if invalid
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) {
        return "Just now";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else {
        // Always show full timestamp
        return format(date, "MMM dd, yyyy HH:mm");
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      // Return the original timestamp if formatting fails
      return timestamp || "Unknown time";
    }
  };

  return (
    <div className="p-5 h-[calc(100vh-90px)]">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-5 gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2 md:p-3 bg-secondary rounded-lg">
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:sub-header font-bold">Notifications</h1>
            <p className="text-xs md:text-sm text-gray-500">
              Real-time updates and alerts
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs md:text-sm text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-primary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:opacity-90 transition-colors font-semibold text-xs md:text-sm"
              >
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="bg-gray-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:opacity-90 transition-colors font-semibold text-xs md:text-sm"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 md:gap-4 mb-3 md:mb-6">
        <div className="border-l-2 sm:border-l-4 border-primary bg-white rounded-lg shadow-sm md:shadow-md p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold mb-0.5 sm:mb-1 md:mb-2 leading-tight">
                Total
              </h3>
              <p className="text-2xl md:text-[36px] font-futura text-primary leading-none">
                {notifications.length}
              </p>
            </div>
            <Bell className="w-4 h-4 sm:w-6 sm:h-6 md:w-12 md:h-12 text-primary opacity-50 flex-shrink-0 hidden sm:block" />
          </div>
        </div>

        <div className="border-l-2 sm:border-l-4 border-primary bg-white rounded-lg shadow-sm md:shadow-md p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold mb-0.5 sm:mb-1 md:mb-2 leading-tight">
                Unread
              </h3>
              <p className="text-2xl md:text-[36px] font-futura text-primary leading-none">
                {unreadCount}
              </p>
            </div>
            <Bell className="w-4 h-4 sm:w-6 sm:h-6 md:w-12 md:h-12 text-primary opacity-50 flex-shrink-0 hidden sm:block" />
          </div>
        </div>

        <div className="hidden md:block border-l-2 sm:border-l-4 border-primary bg-white rounded-lg shadow-sm md:shadow-md p-1.5 sm:p-2 md:p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] sm:text-xs md:text-lg font-semibold mb-0.5 sm:mb-1 md:mb-2 leading-tight">
                Status
              </h3>
              <p className="text-xs sm:text-sm md:text-[18px] font-futura text-primary leading-none">
                {isConnected ? "Active" : "Inactive"}
              </p>
            </div>
            <div
              className={`w-4 h-4 sm:w-6 sm:h-6 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isConnected ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div
                className={`w-2 h-2 sm:w-3 sm:h-3 md:w-6 md:h-6 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List - Mobile Responsive */}
      <div className="bg-white overflow-hidden pb-4 md:pb-5">
        {notifications.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <Bell className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">
              No Notifications
            </h3>
            <p className="text-sm md:text-base text-gray-500">
              {isConnected
                ? "You'll see notifications here when they arrive."
                : "Connect to the notification service to receive updates."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 overflow-y-auto h-[calc(100vh-380px)] md:h-[calc(100vh-350px)]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 md:p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-2 md:gap-4">
                  <div className="mt-0.5 md:mt-1 flex-shrink-0">
                    {getNotificationIcon(notification.orderItemStatus)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-semibold text-gray-900 break-words">
                              {notification.message}
                            </p>
                          </div>
                          {/* {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
                          )} */}
                        </div>

                        {/* Order Info Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {notification.orderFrom && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {notification.orderFrom === "restaurant"
                                ? "Restaurant"
                                : notification.orderFrom.toUpperCase()}
                            </span>
                          )}
                          {notification.orderItemStatus && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                notification.orderItemStatus === "ready"
                                  ? "bg-green-100 text-green-800"
                                  : notification.orderItemStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {notification.orderItemStatus.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          {formatNotificationTime(notification.createdAt)}
                          {notification.createdAt && (
                            <span className="block mt-0.5 text-gray-400">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {/* {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-primary hover:text-primary/80 text-xs md:text-sm font-semibold px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                            title="Mark as read"
                          >
                            Mark Read
                          </button>
                        )} */}
                        {canEdit() && (
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete notification"
                          >
                            <X size={16} className="md:w-[18px] md:h-[18px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
