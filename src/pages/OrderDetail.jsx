import { useEffect, useState } from "react";
import getRestaurantOrderById from "../api/Order/getRestaurantOrderById";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Receipt,
  Edit,
  Printer,
} from "lucide-react";
import { canEdit } from "../utils/getUserRole";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDispatch } from "react-redux";
import { selectRoom } from "../redux/ktvReceiptSlice";
import { selectTable } from "../redux/receiptSlice";
import printReceipt from "../utils/printReceipt";

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getOrder = async () => {
    setLoading(true);
    try {
      const res = await getRestaurantOrderById(id);
      if (res?.success) {
        setOrder(res.data);
        // console.log("order", order);
      } else {
        setError(res.message || "Failed to load order");
      }
    } catch (err) {
      setError("An error occurred while fetching the order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      getOrder();
    }
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getKitchenStatusColor = (status) => {
    switch (status) {
      case "ready":
        return "text-green-600";
      case "preparing":
        return "text-yellow-600";
      case "pending":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  // Check if this is a KTV order
  const isKtvOrder = () => {
    return order && order.roomService && order.roomService.roomNumber;
  };

  // Combine duplicate items by summing quantities and amounts
  const getCombinedOrderItems = () => {
    if (!order?.orderItems || !Array.isArray(order.orderItems)) {
      return [];
    }

    const grouped = new Map();

    order.orderItems.forEach((item) => {
      // Use stockId as primary key, fallback to name
      const key =
        item?.stockId?._id ||
        item?.stockId ||
        item?._id ||
        item?.stockName ||
        "";

      if (!key) return;

      if (grouped.has(key)) {
        const existing = grouped.get(key);
        // Sum quantities
        existing.quantity = (existing.quantity || 0) + (item.quantity || 1);
        // Keep the price (should be same for same item)
        existing.price = item.price || existing.price || 0;
        // Combine notes if they exist
        if (item.notes && existing.notes) {
          existing.notes = `${existing.notes}, ${item.notes}`;
        } else if (item.notes) {
          existing.notes = item.notes;
        }
        // Keep the most recent kitchen status or combine them
        if (
          item.kitchenStatus &&
          existing.kitchenStatus !== item.kitchenStatus
        ) {
          // If statuses differ, keep the one that's not "pending" or use the latest
          if (item.kitchenStatus === "ready") {
            existing.kitchenStatus = "ready";
          } else if (
            existing.kitchenStatus !== "ready" &&
            item.kitchenStatus === "preparing"
          ) {
            existing.kitchenStatus = "preparing";
          }
        }
      } else {
        // Create new entry
        grouped.set(key, {
          ...item,
          stockName: item.stockName || "Item",
          quantity: item.quantity || 1,
          price: item.price || 0,
          _id: item._id || item?.stockId?._id || item?.stockId || key,
          stockId: item.stockId || item._id || key,
        });
      }
    });

    return Array.from(grouped.values());
  };

  // Handle edit order (both restaurant and KTV)
  const handleEditOrder = () => {
    if (isKtvOrder()) {
      // KTV Order - redirect to KTV page
      const roomNumber = order.roomService.roomNumber;
      dispatch(selectRoom(roomNumber));
      navigate("/ktv");
    } else {
      // Restaurant Order - redirect to homepage
      const tableNumber = order.tableService?.tableNumber || order.tableNumber;
      dispatch(selectTable(tableNumber));
      navigate("/");
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    if (!order) return;

    const orderForPrint = {
      ...order,
      tableService: order.tableService || { tableNumber: order.tableNumber },
      tableNumber: order.tableService?.tableNumber || order.tableNumber,
      roomService: order.roomService || null,
      roomNumber: order.roomService?.roomNumber || null,
      orderItems:
        order.orderItems?.map((item) => ({
          stockName: item.stockName,
          name: item.stockName,
          price: item.price,
          quantity: item.quantity || 1,
          _id: item._id,
        })) || [],
    };

    const paperSize = localStorage.getItem("receipt-paper-size") || "57mm";
    printReceipt(orderForPrint, isKtvOrder(), paperSize);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto pt-10 px-4 md:px-20">
        <Link
          to="/orders"
          className="text-blue-500 mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Back to Orders
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto pt-10 px-4 md:px-20">
        <Link
          to="/orders"
          className="text-blue-500 mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Back to Orders
        </Link>
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <p className="text-gray-600 text-lg">Order not found!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-10 px-10  pb-10 overflow-y-auto h-[calc(100vh-100px)]">
      <Link
        to="/orders"
        className="text-primary mb-4 inline-flex items-center gap-2 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Orders
      </Link>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary text-white p-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Details</h1>
              <p className="text-white">Order ID: {order._id}</p>
              <p className="text-blue-200 text-sm mt-1">
                {isKtvOrder() ? "KTV Room Service Order" : "Restaurant Order"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status.toUpperCase()}
              </span>
              <button
                onClick={handlePrintReceipt}
                className="bg-white text-primary px-4 py-2 rounded-full font-semibold text-sm border-2 border-white hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2"
              >
                <Printer size={16} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>

        {/* Order Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="text-primary" size={24} />
              <h3 className="font-semibold text-lg">
                {isKtvOrder() ? "Room Number" : "Table Number"}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {isKtvOrder()
                ? `Room ${order.roomService.roomNumber}`
                : order.tableService?.tableNumber
                ? `Table ${order.tableService.tableNumber}`
                : order.tableNumber
                ? `Table ${order.tableNumber}`
                : "N/A"}
            </p>
          </div>

          {/* <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="text-primary" size={24} />
              <h3 className="font-semibold text-lg">Payment Method</h3>
            </div>
            <p className="text-xl font-semibold text-gray-800 capitalize">
              {order.paymentMethod === "none" ? "Cash" : order.paymentMethod}
            </p>
          </div> */}

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="text-primary" size={24} />
              <h3 className="font-semibold text-lg">Order Date</h3>
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-primary" size={24} />
              <h3 className="font-semibold text-lg">Order Time</h3>
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {formatTime(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6">
          <h2 className="font-bold text-2xl mb-4 text-gray-800">Order Items</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Item
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-700">
                    Quantity
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const combinedItems = getCombinedOrderItems();
                  return combinedItems.length > 0 ? (
                    combinedItems.map((item, index) => (
                      <tr
                        key={
                          item._id || item.stockId?._id || item.stockId || index
                        }
                        className="border-t border-gray-200 hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {item.stockName}
                            </p>
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-1">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-700">
                          x{item.quantity}
                        </td>
                        <td className="p-4 text-right text-gray-700">
                          {item.price.toLocaleString()} MMK
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`font-semibold capitalize ${getKitchenStatusColor(
                              item.kitchenStatus
                            )}`}
                          >
                            {item.kitchenStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right font-semibold text-gray-800">
                          {(item.price * item.quantity).toLocaleString()} MMK
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        No items in this order
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Order Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-xl mb-4 text-gray-800">
              Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-800">
                  {order.subTotal} MMK
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">
                  Tax ({(order.tax / order.subTotal) * 100}%):
                </span>
                <span className="font-semibold text-gray-800">
                  {order.tax.toLocaleString()} MMK
                </span>
              </div>
              {order.serviceFee != null && order.serviceFee > 0 && (
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Service Fee:</span>
                  <span className="font-semibold text-gray-800">
                    {typeof order.serviceFee === "number"
                      ? order.serviceFee.toLocaleString()
                      : (
                          (order.subTotal * (order.serviceFee || 0)) /
                          100
                        ).toLocaleString()}{" "}
                    MMK
                  </span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-lg text-green-600">
                  <span>Discount:</span>
                  <span className="font-semibold">
                    -{order.discount.toLocaleString()} MMK
                  </span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-3 mt-3">
                <div className="flex justify-between text-2xl">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="font-bold text-primary">
                    {order.total} MMK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="bg-gray-100 p-4 text-sm text-gray-600">
          <div className="flex justify-between flex-wrap gap-2">
            <span>Created: {new Date(order.createdAt).toLocaleString()}</span>
            <span>
              Last Updated: {new Date(order.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
