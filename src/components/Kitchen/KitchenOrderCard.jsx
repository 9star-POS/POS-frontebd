import { Clock, Users } from "lucide-react";
import { useState } from "react";

const KitchenOrderCard = ({ item }) => {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-orange-500">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{item.stockName}</h3>
          <p className="text-sm text-gray-500">
            Stock ID: {item.stockId.slice(-8)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">
            {item.totalQuantity}x
          </div>
          <div className="text-sm text-gray-600">
            {item.unitPrice.toLocaleString()} MMK
          </div>
        </div>
      </div>

      <div className="bg-orange-50 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-orange-600" />
            <span className="font-semibold text-gray-700">
              {item.orders.length} Order{item.orders.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">Total</div>
            <div className="text-lg font-bold text-orange-600">
              {item.totalPrice.toLocaleString()} MMK
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {item.orders.map((order, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleOrderExpand(order.orderId)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">
                      {order.userName}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                      {order.orderType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>{formatDate(order.orderCreatedAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-800">
                    {order.quantity}x
                  </div>
                </div>
              </div>
            </div>

            {expandedOrders[order.orderId] && (
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Order ID:</span>
                    <p className="font-mono text-xs text-gray-700 break-all">
                      {order.orderId}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-semibold text-yellow-600">
                      {order.kitchenStatus}
                    </p>
                  </div>
                  {order.orderType === "restaurant" && (
                    <div>
                      <span className="text-gray-500">Table:</span>
                      <p className="font-semibold text-gray-700">
                        {order.tableNumber}
                      </p>
                    </div>
                  )}
                  {order.orderType === "ktv" && (
                    <div>
                      <span className="text-gray-500">Room:</span>
                      <p className="font-semibold text-gray-700">
                        {order.roomNumber}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Item Index:</span>
                    <p className="font-semibold text-gray-700">
                      {order.itemIndex}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Created At:</span>
                    <p className="text-gray-700">
                      {new Date(order.orderCreatedAt).toLocaleString()}
                    </p>
                  </div>
                  {order.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Notes:</span>
                      <p className="font-semibold text-orange-600 bg-orange-50 p-2 rounded mt-1">
                        📝 {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenOrderCard;
