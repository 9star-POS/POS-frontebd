import { useEffect, useState } from "react";
import getKtvOrderById from "../api/KTV/getKtvOrderById";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Receipt,
  Mic,
  DoorOpen,
  Users,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

function KtvOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getOrder = async () => {
    setLoading(true);
    try {
      const res = await getKtvOrderById(id);
      if (res.code === 200 && res.status === "success") {
        setOrder(res.data);
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

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
    <div className=" pt-10 px-4 md:px-10 pb-10 overflow-y-auto h-[calc(100vh-100px)]">
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
              <h1 className="text-3xl font-bold mb-2">KTV Order Details</h1>
              <p className="text-white">Order ID: {order._id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Room & Payment Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <DoorOpen className="text-primary" size={24} />
              <h3 className="font-semibold text-lg">Room Number</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              Room {order.roomService?.roomNumber || "N/A"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {order.roomService?.hourlyRate?.toLocaleString() || 0} MMK/hour
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="text-primary" size={24} />
              <h3 className="font-semibold text-lg">Payment Method</h3>
            </div>
            <p className="text-xl font-semibold text-gray-800 capitalize">
              {order.paymentMethod === "none"
                ? "Not Paid"
                : order.paymentMethod}
            </p>
          </div>

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

        {/* Room Service Details */}
        {order.roomService && (
          <div className="p-6 border-t border-gray-200">
            <h2 className="font-bold text-2xl mb-4 text-gray-800 flex items-center gap-2">
              <DoorOpen className="text-primary" size={28} />
              Room Service Details
            </h2>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service Started</p>
                  <p className="font-semibold text-gray-800">
                    {formatTime(order.roomService.serviceStartedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Service Ended</p>
                  <p className="font-semibold text-gray-800">
                    {order.roomService.serviceEndedAt
                      ? formatTime(order.roomService.serviceEndedAt)
                      : "Ongoing"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-800">
                    {order.roomService.serviceEndedAt
                      ? calculateDuration(
                          order.roomService.serviceStartedAt,
                          order.roomService.serviceEndedAt
                        )
                      : `${order.roomServiceTime} hour(s)`}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-primary">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">
                    Room Charges:
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {order.roomCharges} MMK
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vocalist Details */}
        {order.vocalist && order.vocalist.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h2 className="font-bold text-2xl mb-4 text-gray-800 flex items-center gap-2">
              <Mic className="text-primary" size={28} />
              Vocalist Services
            </h2>
            <div className="space-y-4">
              {order.vocalist.map((vocalist) => (
                <div
                  key={vocalist._id}
                  className="bg-pink-50 rounded-lg p-4 border border-pink-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users className="text-primary" size={24} />
                      <h3 className="font-bold text-lg text-gray-800">
                        {vocalist.vocalistName}
                      </h3>
                    </div>
                    <span className="text-sm bg-pink-200 text-pink-800 px-3 py-1 rounded-full font-semibold">
                      {vocalist.hourlyRate} MMK/hour
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Service Started</p>
                      <p className="font-semibold text-gray-800">
                        {formatTime(vocalist.serviceStartedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Service Duration</p>
                      <p className="font-semibold text-gray-800">
                        {vocalist.serviceTime} hour(s)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-pink-100 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">
                    Total Vocalist Charges:
                  </span>
                  <span className="text-xl font-bold text-pink-600">
                    {order.vocalistCharges} MMK
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        {order.orderItems && order.orderItems.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h2 className="font-bold text-2xl mb-4 text-gray-800 flex items-center gap-2">
              <Receipt className="text-purple-600" size={28} />
              Food & Beverage Items
            </h2>
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
                  {order.orderItems.map((item) => (
                    <tr
                      key={item._id}
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
                          {item.requiresCooking && (
                            <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              Requires Cooking
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center text-gray-700">
                        x{item.quantity}
                      </td>
                      <td className="p-4 text-right text-gray-700">
                        {item.price} MMK
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
                        {item.price * item.quantity} MMK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="p-6 border-t border-gray-200">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
            <h3 className="font-bold text-xl mb-4 text-gray-800">
              Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Room Charges:</span>
                <span className="font-semibold text-gray-800">
                  {order.roomCharges} MMK
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Vocalist Charges:</span>
                <span className="font-semibold text-gray-800">
                  {order.vocalistCharges} MMK
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Food & Beverage:</span>
                <span className="font-semibold text-gray-800">
                  {order.subTotal} MMK
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold text-gray-800">
                  {order.tax} MMK
                </span>
              </div>
              {/* {order.discount > 0 && ( */}
              <div className="flex justify-between text-lg text-green-600">
                <span>Discount:</span>
                <span className="font-semibold">
                  -{order.discount.toLocaleString()} MMK
                </span>
              </div>
              {/* )} */}
              <div className="border-t-2 border-purple-300 pt-3 mt-3">
                <div className="flex justify-between text-2xl">
                  <span className="font-bold text-gray-800">Grand Total:</span>
                  <span className="font-bold text-purple-600">
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

export default KtvOrderDetail;
