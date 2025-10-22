import TimestampFormatter from "./TimestampFormatter";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import DeleteModel from "../DeleteModel";

function OrderTable({ sendData, orders, deleteOrder, setOrderIds }) {
  // console.log(orders[0].tax);
  const [selectedOrders, setselectedOrders] = useState([]); // For selected mail _IDs
  const [orderId, setOrderId] = useState([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false); // For selected mail _IDs
  const handleSendData = (orderId) => {
    sendData(orderId);
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
    <div className="shadow-lg h-[75vh] overflow-y-auto border border-gray-200">
      <table className="min-w-full divide-y bg-primary divide-gray-200">
        <thead className="bg-primary">
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
              Order Type
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
            <th className="hidden sm:block px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 ">
          {orders.map((order, index) => (
            <tr
              key={order._id}
              className="font-bold text-md md:text-lg cursor-pointer hover:bg-gray-100"
              onClick={() => handleSendData(order._id)}
            >
              <td
                className="px-2 lg:px-6 py-4 whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  if (selectedOrders.includes(order._id)) {
                    // If already selected, remove from the selection
                    setselectedOrders(
                      selectedOrders.filter((id) => id !== order._id)
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
                        selectedOrders.filter((id) => id !== order._id)
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
                {order.orderType}
              </td>
              <td className="px-2 lg:px-6 lg:py-4 whitespace-nowrap">
                <span className="hidden lg:inline">
                  {new Date(order.createdAt).toLocaleDateString("en-GB")}{" "}
                </span>
                <TimestampFormatter timestamp={order.createdAt} />
              </td>
              <td className="hidden md:block px-2 lg:px-6 py-4 whitespace-nowrap">
                {order.totalQuantity}{" "}
                {order.totalQuantity > 1 ? "dishes" : "dish"}
              </td>
              <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                {order.finalPrice.toLocaleString()} MMK
              </td>
              <td className="hidden sm:block px-2 lg:px-6 py-4 whitespace-nowrap ">
                <div className="flex space-x-4 items-center">
                  <button
                    className="text-blue-500 font-bold hover:text-blue-700"
                    onClick={() => handleSendData(order._id)}
                  >
                    <MdOutlineRemoveRedEye size={25} />
                  </button>
                  {/* <button
                    className="text-blzck hover:text-gray-700"
                    onClick={(e) => {
                      setOrderId([order._id]);
                      setIsDeleteOpen(true);
                      e.stopPropagation();
                      // deleteOrder([order._id]);
                    }}
                  >
                    <FaRegTrashAlt size={23} />
                  </button> */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <DeleteModel
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        submit={() => {
          deleteOrder(orderId);
          setIsDeleteOpen(false);
        }}
      />
    </div>
  );
}

export default OrderTable;
