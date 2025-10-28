import { useState, useEffect } from "react";
import { RefreshCw, ChefHat, AlertCircle } from "lucide-react";
import getPendingOrders from "../api/Kitchen/getPendingOrders";
import KitchenOrderCard from "../components/Kitchen/KitchenOrderCard";
import LoadingSpinner from "../components/LoadingSpinner";

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getPendingOrders();
      if (response.status === "success") {
        setOrders(response.data);
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
  }, []);

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
