import { useState, useEffect, useRef } from "react";
import { RefreshCw, ChefHat, AlertCircle } from "lucide-react";
import { io } from "socket.io-client";
import getKitchenOrders from "../api/Kitchen/getKitchenOrders";
import updateKitchenItemStatus from "../api/Kitchen/updateKitchenItemStatus";
import createNotification from "../api/notification/createNotification";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "sonner";

const KitchenPage = () => {
  const [allOrders, setAllOrders] = useState([]); // Store all orders for stats calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending"); // "pending", "ready"
  const [updatingItems, setUpdatingItems] = useState(new Set()); // Track items being updated
  const socketRef = useRef(null);

  // Transform flat API data into simple list structure
  const transformKitchenData = (apiData) => {
    if (!Array.isArray(apiData)) return [];

    // Transform each item into order item structure (without filtering)
    return apiData.map((item) => ({
      id: item.orderItemId, // Unique identifier for checkboxes
      orderId: item.orderId,
      orderItemId: item.orderItemId,
      stockName: item.stockName,
      quantity: item.quantity,
      kitchenStatus: item.kitchenStatus,
      notes: item.notes,
      orderType: item.orderType,
      roomNumber: item.roomNumber, // Add room number for KTV orders
      tableNumber: item.tableNumber, // Add table number for restaurant orders
      createdAt: item.createdAt || new Date().toISOString(),
      requiresCooking: item.requiresCooking,
      // Additional display fields
      orderDisplay: `${item.orderType.toUpperCase()} #${item.orderId.slice(
        -6
      )}`,
      statusColor:
        item.kitchenStatus === "pending"
          ? "orange"
          : item.kitchenStatus === "ready"
          ? "green"
          : "gray",
    }));
  };

  // Filter orders based on status filter
  const getFilteredOrders = () => {
    return allOrders.filter((item) => item.kitchenStatus === statusFilter);
  };

  // Individual item status update
  const handleItemStatusToggle = async (item) => {
    // Prevent multiple simultaneous updates for the same item
    if (updatingItems.has(item.id)) return;

    try {
      const newStatus = item.kitchenStatus === "ready" ? "pending" : "ready";

      // Add item to updating set to show loading state
      setUpdatingItems((prev) => new Set([...prev, item.id]));

      console.log(`Updating item ${item.orderItemId} to status: ${newStatus}`);

      // Call the actual API to update item status
      const response = await updateKitchenItemStatus(
        item.orderId,
        item.orderType,
        item.orderItemId,
        newStatus
      );

      if (response?.success) {
        // Update local state immediately for better UX
        const updatedAllOrders = allOrders.map((order) =>
          order.id === item.id ? { ...order, kitchenStatus: newStatus } : order
        );
        setAllOrders(updatedAllOrders);

        // Clear any existing errors
        setError(null);

        // Send notification only when status changes to "ready"
        if (newStatus === "ready") {
          try {
            // Construct notification message
            const tableOrRoomInfo =
              item.orderType === "restaurant" && item.tableNumber
                ? `Table ${item.tableNumber}`
                : item.orderType === "ktv" && item.roomNumber
                ? `Room ${item.roomNumber}`
                : item.orderDisplay;

            const message = `${tableOrRoomInfo} - ${item.quantity}x ${item.stockName} is ready to serve`;

            // Prepare notification data
            const notificationData = {
              orderFrom: item.orderType, // "restaurant" or "ktv"
              orderItemStatus: "ready",
              message: message,
              metadata: {
                orderId: item.orderId,
                orderItemId: item.orderItemId,
                stockName: item.stockName,
                ...(item.orderType === "restaurant" &&
                  item.tableNumber && { tableNumber: item.tableNumber }),
                ...(item.orderType === "ktv" &&
                  item.roomNumber && { roomNumber: item.roomNumber }),
                quantity: item.quantity,
                ...(item.notes && { notes: item.notes }),
              },
            };

            // Send notification
            const notificationResponse = await createNotification(
              notificationData
            );
            console.log("notificationResponse", notificationResponse);

            if (notificationResponse?.success) {
              console.log(
                "Notification sent successfully:",
                notificationResponse
              );
            } else {
              console.error(
                "Failed to send notification:",
                notificationResponse
              );
              // Don't show error to user as the main status update succeeded
            }
          } catch (notificationError) {
            console.error("Error sending notification:", notificationError);
            // Don't show error to user as the main status update succeeded
          }
        }

        // Optionally refresh from server to ensure consistency
        // fetchOrders(true);
      } else {
        setError(response.message || "Failed to update item status");
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      setError("Failed to update item status. Please try again.");
    } finally {
      // Remove item from updating set
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getKitchenOrders();
      if (response?.success) {
        const transformedData = transformKitchenData(response.data);
        setAllOrders(transformedData); // Store all orders
      } else {
        setError(response.message || "Failed to fetch kitchen orders");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch kitchen orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []); // Only fetch on mount, filtering is done client-side

  // WebSocket connection for real-time restaurant orders
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
      console.log("Kitchen Socket.IO connected");
    });

    socket.on("disconnect", () => {
      console.log("Kitchen Socket.IO disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Kitchen Socket.IO connection error:", error);
    });

    // Listen for "new-restaurant-order" event
    socket.on("new-restaurant-order", (data) => {
      console.log("New restaurant order received:", data);
      // try {
      //   // Transform the incoming order data to match our structure
      //   if (data && Array.isArray(data.items)) {
      //     // If data contains multiple items
      //     const newOrderItems = data.items.map((item) => ({
      //       id: item.orderItemId || Date.now() + Math.random(),
      //       orderId: item.orderId || data.orderId,
      //       orderItemId: item.orderItemId,
      //       stockName: item.stockName || item.name,
      //       quantity: item.quantity || 1,
      //       kitchenStatus: item.kitchenStatus || "pending",
      //       notes: item.notes || "",
      //       orderType: item.orderType || "restaurant",
      //       roomNumber: item.roomNumber,
      //       tableNumber: item.tableNumber || data.tableNumber,
      //       createdAt: item.createdAt || new Date().toISOString(),
      //       requiresCooking: item.requiresCooking !== false,
      //       orderDisplay: `${(
      //         item.orderType || "restaurant"
      //       ).toUpperCase()} #${(item.orderId || data.orderId || "").slice(
      //         -6
      //       )}`,
      //       statusColor:
      //         (item.kitchenStatus || "pending") === "pending"
      //           ? "orange"
      //           : "green",
      //     }));

      //     // Add new orders to the existing list (prepend to show newest first)
      //     setAllOrders((prev) => {
      //       // Filter out duplicates based on orderItemId
      //       const existingIds = new Set(prev.map((order) => order.orderItemId));
      //       const uniqueNewItems = newOrderItems.filter(
      //         (item) => !existingIds.has(item.orderItemId)
      //       );
      //       return [...uniqueNewItems, ...prev];
      //     });

      //     // Show toast notification for new orders
      //     const orderCount = newOrderItems.length;
      //     const tableInfo = data.tableNumber
      //       ? `Table ${data.tableNumber}`
      //       : "Restaurant";
      //     toast.success(
      //       `New order from ${tableInfo}: ${orderCount} item${
      //         orderCount > 1 ? "s" : ""
      //       }`,
      //       {
      //         duration: 5000,
      //       }
      //     );
      //   } else if (data && data.orderItemId) {
      //     // If data is a single item
      //     const newOrderItem = {
      //       id: data.orderItemId || Date.now() + Math.random(),
      //       orderId: data.orderId,
      //       orderItemId: data.orderItemId,
      //       stockName: data.stockName || data.name,
      //       quantity: data.quantity || 1,
      //       kitchenStatus: data.kitchenStatus || "pending",
      //       notes: data.notes || "",
      //       orderType: data.orderType || "restaurant",
      //       roomNumber: data.roomNumber,
      //       tableNumber: data.tableNumber,
      //       createdAt: data.createdAt || new Date().toISOString(),
      //       requiresCooking: data.requiresCooking !== false,
      //       orderDisplay: `${(
      //         data.orderType || "restaurant"
      //       ).toUpperCase()} #${(data.orderId || "").slice(-6)}`,
      //       statusColor:
      //         (data.kitchenStatus || "pending") === "pending"
      //           ? "orange"
      //           : "green",
      //     };

      //     // Add new order to the existing list (prepend to show newest first)
      //     setAllOrders((prev) => {
      //       // Check if order already exists
      //       const exists = prev.some(
      //         (order) => order.orderItemId === newOrderItem.orderItemId
      //       );
      //       if (exists) {
      //         return prev;
      //       }
      //       return [newOrderItem, ...prev];
      //     });

      //     // Show toast notification
      //     const tableInfo = data.tableNumber
      //       ? `Table ${data.tableNumber}`
      //       : "Restaurant";
      //     toast.success(
      //       `New order from ${tableInfo}: ${newOrderItem.quantity}x ${newOrderItem.stockName}`,
      //       {
      //         duration: 5000,
      //       }
      //     );
      //   }
      // } catch (error) {
      //   console.error("Error processing new restaurant order:", error);
      //   toast.error("Error processing new order", {
      //     duration: 3000,
      //   });
      // }
    });

    socket.on("new-ktv-order", (data) => {
      console.log("New KTV order received:", data);
      // try {
      //   // Transform the incoming order data to match our structure
      //   if (data && Array.isArray(data.items)) {
      //     // If data contains multiple items
      //     const newOrderItems = data.items.map((item) => ({
      //       id: item.orderItemId || Date.now() + Math.random(),
      //       orderId: item.orderId || data.orderId,
      //       orderItemId: item.orderItemId,
      //       stockName: item.stockName || item.name,
      //       quantity: item.quantity || 1,
      //       kitchenStatus: item.kitchenStatus || "pending",
      //       notes: item.notes || "",
      //       orderType: item.orderType || "restaurant",
      //       roomNumber: item.roomNumber,
      //       tableNumber: item.tableNumber || data.tableNumber,
      //       createdAt: item.createdAt || new Date().toISOString(),
      //       requiresCooking: item.requiresCooking !== false,
      //       orderDisplay: `${(
      //         item.orderType || "restaurant"
      //       ).toUpperCase()} #${(item.orderId || data.orderId || "").slice(
      //         -6
      //       )}`,
      //       statusColor:
      //         (item.kitchenStatus || "pending") === "pending"
      //           ? "orange"
      //           : "green",
      //     }));

      //     // Add new orders to the existing list (prepend to show newest first)
      //     setAllOrders((prev) => {
      //       // Filter out duplicates based on orderItemId
      //       const existingIds = new Set(prev.map((order) => order.orderItemId));
      //       const uniqueNewItems = newOrderItems.filter(
      //         (item) => !existingIds.has(item.orderItemId)
      //       );
      //       return [...uniqueNewItems, ...prev];
      //     });

      //     // Show toast notification for new orders
      //     const orderCount = newOrderItems.length;
      //     const tableInfo = data.tableNumber
      //       ? `Table ${data.tableNumber}`
      //       : "Restaurant";
      //     toast.success(
      //       `New order from ${tableInfo}: ${orderCount} item${
      //         orderCount > 1 ? "s" : ""
      //       }`,
      //       {
      //         duration: 5000,
      //       }
      //     );
      //   } else if (data && data.orderItemId) {
      //     // If data is a single item
      //     const newOrderItem = {
      //       id: data.orderItemId || Date.now() + Math.random(),
      //       orderId: data.orderId,
      //       orderItemId: data.orderItemId,
      //       stockName: data.stockName || data.name,
      //       quantity: data.quantity || 1,
      //       kitchenStatus: data.kitchenStatus || "pending",
      //       notes: data.notes || "",
      //       orderType: data.orderType || "restaurant",
      //       roomNumber: data.roomNumber,
      //       tableNumber: data.tableNumber,
      //       createdAt: data.createdAt || new Date().toISOString(),
      //       requiresCooking: data.requiresCooking !== false,
      //       orderDisplay: `${(
      //         data.orderType || "restaurant"
      //       ).toUpperCase()} #${(data.orderId || "").slice(-6)}`,
      //       statusColor:
      //         (data.kitchenStatus || "pending") === "pending"
      //           ? "orange"
      //           : "green",
      //     };

      //     // Add new order to the existing list (prepend to show newest first)
      //     setAllOrders((prev) => {
      //       // Check if order already exists
      //       const exists = prev.some(
      //         (order) => order.orderItemId === newOrderItem.orderItemId
      //       );
      //       if (exists) {
      //         return prev;
      //       }
      //       return [newOrderItem, ...prev];
      //     });

      //     // Show toast notification
      //     const tableInfo = data.tableNumber
      //       ? `Table ${data.tableNumber}`
      //       : "Restaurant";
      //     toast.success(
      //       `New order from ${tableInfo}: ${newOrderItem.quantity}x ${newOrderItem.stockName}`,
      //       {
      //         duration: 5000,
      //       }
      //     );
      //   }
      // } catch (error) {
      //   console.error("Error processing new restaurant order:", error);
      //   toast.error("Error processing new order", {
      //     duration: 3000,
      //   });
      // }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const getTotalItems = () => {
    return allOrders.length;
  };

  const getTotalQuantity = () => {
    return allOrders.reduce((total, item) => total + item.quantity, 0);
  };

  const getPendingCount = () => {
    return allOrders.filter((item) => item.kitchenStatus === "pending").length;
  };

  const getReadyCount = () => {
    return allOrders.filter((item) => item.kitchenStatus === "ready").length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 h-[calc(100vh-90px)]">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-2 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary rounded-lg">
              <ChefHat size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="sub-header font-bold">Kitchen Orders</h1>
              <p className="text-sm text-gray-500">
                Manage your pending orders
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className={`p-3 bg-primary text-white rounded-lg hover:opacity-90 transition-colors font-semibold ${
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCw size={24} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
            <div className="text-sm text-gray-600 font-medium mb-1">
              Total Items
            </div>
            <div className="text-[36px] font-futura text-primary">
              {getTotalItems()}
            </div>
          </div>
          <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
            <div className="text-sm text-gray-600 font-medium mb-1">
              Pending
            </div>
            <div className="text-[36px] font-futura text-primary">
              {getPendingCount()}
            </div>
          </div>
          <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
            <div className="text-sm text-gray-600 font-medium mb-1">Ready</div>
            <div className="text-[36px] font-futura text-primary">
              {getReadyCount()}
            </div>
          </div>
          <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
            <div className="text-sm text-gray-600 font-medium mb-1">
              Total Quantity
            </div>
            <div className="text-[36px] font-futura text-primary">
              {getTotalQuantity()}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Kitchen Orders - Check items when ready
          </h3>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              statusFilter === "pending"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("ready")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              statusFilter === "ready"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ready
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Order Items List */}
      {getFilteredOrders().length === 0 ? (
        <div className="text-center pt-20">
          <ChefHat size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Kitchen Orders
          </h3>
          <p className="text-gray-500">
            All orders have been completed or there are no new orders yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden pb-10  overflow-y-auto h-[calc(100vh-500px)]">
          {/* Order Items */}
          <div className="divide-y divide-gray-200">
            {getFilteredOrders().map((item, index) => (
              <div
                key={item.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  item.kitchenStatus === "ready" ? "bg-green-50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Ready Checkbox with Label */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={item.kitchenStatus === "ready"}
                        onChange={() => handleItemStatusToggle(item)}
                        disabled={updatingItems.has(item.id)}
                        className={`w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 ${
                          updatingItems.has(item.id)
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        title={
                          updatingItems.has(item.id)
                            ? "Updating..."
                            : item.kitchenStatus === "ready"
                            ? "Mark as pending"
                            : "Mark as ready"
                        }
                      />
                      {updatingItems.has(item.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 text-center">
                      {updatingItems.has(item.id)
                        ? "Updating..."
                        : item.kitchenStatus === "ready"
                        ? "Ready"
                        : "Cook"}
                    </span>
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.stockName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.orderDisplay}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-900">
                          {item.quantity}x
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.kitchenStatus === "pending"
                              ? "bg-orange-100 text-orange-800"
                              : item.kitchenStatus === "ready"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.kitchenStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Order Type:</span>{" "}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.orderType === "restaurant"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {item.orderType.toUpperCase()}
                        </span>
                        {item.orderType === "restaurant" &&
                          item.tableNumber && (
                            <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                              Table {item.tableNumber}
                            </span>
                          )}
                        {item.orderType === "ktv" && item.roomNumber && (
                          <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                            Room {item.roomNumber}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Order ID:</span>{" "}
                        <span className="font-mono text-xs">
                          #{item.orderId.slice(-8)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>{" "}
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                        <span className="text-sm font-medium text-yellow-800">
                          📝 Note:
                        </span>
                        <span className="text-sm text-yellow-700 ml-1">
                          {item.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
