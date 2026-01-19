import TimestampFormatter from "./TimestampFormatter";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteModel from "../DeleteModel";
import { canEdit } from "../../utils/getUserRole";

function OrderTable({
  sendData,
  orders,
  deleteOrder,
  setOrderIds,
  onSoftDelete,
  onDeleteKtvOrder,
}) {
  // console.log(orders[0].tax);
  const navigate = useNavigate();
  const [selectedOrders, setselectedOrders] = useState([]); // For selected mail _IDs
  const [orderId, setOrderId] = useState([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false); // For selected mail _IDs
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const handleViewOrder = (order, e) => {
    e.stopPropagation();
    // Check if it's a KTV order (has roomService) or restaurant order (has tableNumber only)
    if (order.roomService) {
      navigate(`/ktv-orders/${order._id}`);
    } else {
      navigate(`/orders/${order._id}`);
    }
  };

  const handleSendData = (orderId) => {
    sendData(orderId);
  };

  const handleDeleteClick = (order, e) => {
    e.stopPropagation();
    setOrderId([order._id]);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    setOrderIds(selectedOrders);
  }, [selectedOrders]);

  const selectAllOrders = () => {
    if (selectedOrders.length !== orders.length) {
      // Select all mail _IDs
      const allorderIds = orders.map((order) => order._id); // Use _id instead of id
      setselectedOrders(allorderIds);
    } else {
      // Clear selection
      setselectedOrders([]);
    }
  };

  return (
    <div className="shadow-lg h-[calc(100vh-280px)] overflow-y-auto border border-gray-200">
      <table className="min-w-full divide-y bg-primary divide-gray-200">
        <thead className="bg-primary sticky top-0">
          <tr className="font-bold text-md md:text-lg">
            <th
              className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                selectAllOrders();
              }}
            >
              <input
                type="checkbox"
                className="mr-2"
                onChange={selectAllOrders}
                checked={
                  orders.length > 0 && selectedOrders.length === orders.length
                } // Check if all are selected
              />
            </th>
            <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
              No
            </th>
            <th className="hidden lg:block px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
              Table/Room
            </th>
            <th className="px-2 lg:px-6 lg:py-4 text-left text-md font-semibold text-white tracking-wider">
              Order Time
            </th>
            <th className="hidden md:block px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
              Quantity
            </th>
            <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
              Total Price
            </th>
            <th className="hidden lg:block px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
              Payment Method
            </th>
            <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 ">
          {orders.map((order, index) => (
            <tr
              key={order._id}
              className="font-bold text-md md:text-lg cursor-pointer hover:bg-gray-100"
              onClick={(e) => handleViewOrder(order, e)}
            >
              <td
                className="px-2 lg:px-6 py-4 whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  if (selectedOrders.includes(order._id)) {
                    // If already selected, remove from the selection
                    setselectedOrders(
                      selectedOrders.filter((id) => id !== order._id),
                    );
                  } else {
                    // If not selected, add to selection
                    setselectedOrders([...selectedOrders, order._id]);
                  }
                }}
              >
                <input
                  type="checkbox"
                  className="mail-checkbox"
                  checked={selectedOrders.includes(order._id)} // Check if mail _ID is selected
                  onChange={() => {
                    if (selectedOrders.includes(order._id)) {
                      // If already selected, remove from the selection
                      setselectedOrders(
                        selectedOrders.filter((id) => id !== order._id),
                      );
                    } else {
                      // If not selected, add to selection
                      setselectedOrders([...selectedOrders, order._id]);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent row click
                />
              </td>
              <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                {index + 1}
              </td>
              <td className="hidden lg:block px-2 lg:px-6 py-4 whitespace-nowrap">
                {order.tableService?.tableNumber
                  ? `Table ${order.tableService.tableNumber}`
                  : order.tableNumber
                    ? `Table ${order.tableNumber}`
                    : order.roomService?.roomNumber
                      ? `Room ${order.roomService.roomNumber}`
                      : "N/A"}
              </td>
              <td className="px-2 lg:px-6 lg:py-4 whitespace-nowrap">
                <span className="hidden lg:inline">
                  {new Date(order.createdAt).toLocaleDateString("en-GB")}{" "}
                </span>
                <TimestampFormatter timestamp={order.createdAt} />
              </td>
              <td className="hidden md:block px-2 lg:px-6 py-4 whitespace-nowrap">
                {order.orderItems?.reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0,
                )}{" "}
                {order.orderItems?.reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0,
                ) > 1
                  ? "items"
                  : "item"}
              </td>
              <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                {order.total != null
                  ? Number(order.total).toLocaleString()
                  : "Pending"}{" "}
                {order.total != null && "MMK"}
              </td>
              <td className="hidden lg:block px-2 lg:px-6 py-4 whitespace-nowrap">
                {order.paymentMethods && order.paymentMethods.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {order.paymentMethods.map((payment, index) => (
                      <span
                        key={payment._id || index}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.paymentMethod === "cash"
                            ? "bg-green-100 text-green-800"
                            : payment.paymentMethod === "kpay"
                              ? "bg-blue-100 text-blue-800"
                              : payment.paymentMethod === "wavepay"
                                ? "bg-purple-100 text-purple-800"
                                : payment.paymentMethod === "foc"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {payment.paymentMethod === "wavepay"
                          ? "WavePay"
                          : payment.paymentMethod === "foc"
                            ? "FOC"
                            : payment.paymentMethod.toUpperCase()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    N/A
                  </span>
                )}
              </td>
              <td className="px-2 lg:px-6 py-4 whitespace-nowrap ">
                <div className="flex space-x-4 items-center">
                  <button
                    className="text-blue-500 font-bold hover:text-blue-700"
                    onClick={(e) => handleViewOrder(order, e)}
                    title="View Order"
                  >
                    <MdOutlineRemoveRedEye size={25} />
                  </button>
                  {/* Show delete button for both restaurant and KTV orders if user can edit */}
                  {canEdit() && (
                    <button
                      className="text-red-500 font-bold hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => handleDeleteClick(order, e)}
                      disabled={deletingOrderId === order._id}
                      title="Delete Order"
                    >
                      {deletingOrderId === order._id ? (
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FaRegTrashAlt size={23} />
                      )}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <DeleteModel
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingOrderId(null);
        }}
        submit={async () => {
          if (orderId.length > 0) {
            setDeletingOrderId(orderId[0]);
            try {
              // Find the order to determine if it's KTV or restaurant
              const order = orders.find((o) => o._id === orderId[0]);
              if (order?.roomService && onDeleteKtvOrder) {
                // Delete KTV order
                await onDeleteKtvOrder(orderId[0]);
              } else if (!order?.roomService && onSoftDelete) {
                // Delete restaurant order
                await onSoftDelete(orderId[0]);
              }
              setIsDeleteOpen(false);
              setOrderId([]);
            } catch (error) {
              // console.error("Error deleting order:", error);
            } finally {
              setDeletingOrderId(null);
            }
          }
        }}
        text="Are you sure you want to delete this order? This action cannot be undone."
      />
    </div>
  );
}

export default OrderTable;
