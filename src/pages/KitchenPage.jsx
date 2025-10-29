import { useState, useEffect } from "react";
import { RefreshCw, ChefHat, AlertCircle } from "lucide-react";
import getKitchenOrders from "../api/Kitchen/getKitchenOrders";
import KitchenOrderCard from "../components/Kitchen/KitchenOrderCard";
import LoadingSpinner from "../components/LoadingSpinner";

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "ready"

  // Transform flat API data into grouped structure
  const transformKitchenData = (apiData) => {
    if (!Array.isArray(apiData)) return [];

    // Filter by status if needed
    const filteredData =
      statusFilter === "all"
        ? apiData
        : apiData.filter((item) => item.kitchenStatus === statusFilter);

    // Group items by stockName (dish name)
    const grouped = filteredData.reduce((acc, item) => {
      const key = item.stockName;
      if (!acc[key]) {
        acc[key] = {
          stockName: item.stockName,
          stockId: item.orderItemId, // Use orderItemId as fallback
          category: `${item.stockName} Orders`, // Better category naming
          orders: [],
          totalQuantity: 0,
          unitPrice: 0, // We'll calculate this from first order
          totalPrice: 0,
        };
      }

      // Add order to the group
      acc[key].orders.push({
        orderId: item.orderId,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        kitchenStatus: item.kitchenStatus,
        notes: item.notes,
        orderType: item.orderType,
        orderCreatedAt: item.createdAt || new Date().toISOString(),
        userName: `${item.orderType.toUpperCase()} #${item.orderId.slice(-6)}`,
        tableNumber: item.orderType === "restaurant" ? "Table N/A" : undefined,
        roomNumber: item.orderType === "ktv" ? "Room N/A" : undefined,
        itemIndex: acc[key].orders.length + 1,
      });

      // Update totals
      acc[key].totalQuantity += item.quantity;
      // Assume a default price if not provided
      acc[key].unitPrice = acc[key].unitPrice || 1000; // Default 1000 MMK
      acc[key].totalPrice = acc[key].totalQuantity * acc[key].unitPrice;

      return acc;
    }, {});

    // Convert to array and group by category (using stockName as category)
    const itemsArray = Object.values(grouped);
    const categoriesMap = itemsArray.reduce((acc, item) => {
      const categoryName = item.category;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          items: [],
          totalItems: 0,
          totalQuantity: 0,
        };
      }

      acc[categoryName].items.push(item);
      acc[categoryName].totalItems += 1;
      acc[categoryName].totalQuantity += item.totalQuantity;

      return acc;
    }, {});

    return Object.values(categoriesMap);
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
      if (response.status === "success" && response.code === 200) {
        const transformedData = transformKitchenData(response.data);
        setOrders(transformedData);
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter]); // Re-fetch when filter changes

  const getTotalItems = () => {
    return orders.reduce((total, category) => total + category.totalItems, 0);
  };

  const getTotalQuantity = () => {
    return orders.reduce(
      (total, category) => total + category.totalQuantity,
      0
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 md:p-6 overflow-y-auto h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChefHat size={32} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Kitchen Orders
              </h1>
              <p className="text-sm text-gray-500">
                Manage your pending orders
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className={`p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors ${
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCw size={24} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">
              Categories
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {orders.length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">
              Total Items
            </div>
            <div className="text-2xl font-bold text-green-700">
              {getTotalItems()}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 col-span-2 md:col-span-1">
            <div className="text-sm text-orange-600 font-medium mb-1">
              Total Quantity
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {getTotalQuantity()}
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Filter by Status
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("ready")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "ready"
                ? "bg-green-500 text-white"
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

      {/* Orders by Category */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ChefHat size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Pending Orders
          </h3>
          <p className="text-gray-500">
            All orders have been completed or there are no new orders yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-4 md:p-6"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize">
                    {category.category}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {category.totalItems} item
                    {category.totalItems > 1 ? "s" : ""} •{" "}
                    {category.totalQuantity} total quantity
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <KitchenOrderCard key={itemIndex} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
