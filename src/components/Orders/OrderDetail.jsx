import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import getAOrders from "./../../api/Order/getAOrder";
import TimestampFormatter from "./../../components/Orders/TimestampFormatter";
import editOrderData from "../../api/Order/editOrder";
import { IoMdTrash } from "react-icons/io";
import { ArrowLeft } from "lucide-react";
import DeleteModel from "../DeleteModel";

function OrderDetail({
  id,
  closeOrderDetails,
  menuItem,
  editClick,
  editedOrderClick,
  mobileEditClick,
}) {
  const [order, setOrder] = useState(null);
  const [date, setDate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState([]);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taxRate, setTaxRate] = useState(order ? order.tax * 100 : 0); // Initialize with order tax if available

  const getOrder = async () => {
    const res = await getAOrders(id);
    if (res.code === 200 && res.status !== "error") {
      setOrder(res.data);
      // console.log("order", res.data?.createdAt);
      const date = new Date(res.data?.createdAt);
      if (!isNaN(date.getTime())) {
        // Check if the date is valid
        const formatDate = date.toLocaleDateString("en-GB"); // Format date to dd-mm-yyyy
        setDate(formatDate);
      } else {
        // console.error("Invalid date");
        setDate("");
      }
      // console.log(formatDate);
      setEditedOrder(res.data.orders);
      // setOriginalOrder(res.data.orders);
      setTaxRate(res.data.tax * 100); // Set initial tax rate in percentage
    }
  };

  // console.log("Editorder", editedOrder);

  useEffect(() => {
    getOrder();
  }, [id]);

  const handleQuantityChange = (index, value) => {
    const newOrders = [...editedOrder];
    newOrders[index].quantity = value;
    setEditedOrder(newOrders);
  };

  const calculateItemPrice = (item) => {
    return item.price * item.quantity;
  };

  const handleEditSubmit = async () => {
    const filterOrder = editedOrder.filter((item) => item.quantity > 0);
    const updatedOrderData = {
      table: order.table,
      tax: taxRate / 100, // Store tax as a decimal value
      orderType: order.orderType,
      paymentType: order.paymentType,
      orders: filterOrder,
      totalPrice: calculateTotalPrice(filterOrder),
      finalPrice: calculateFinalPrice(filterOrder), // This now reflects the new tax
      paidPrice: order.paidPrice,
      extraChange: order.extraChange,
    };
    // console.log("updateOrder", updatedOrderData);
    const res = await editOrderData({ id, orderData: updatedOrderData });
    // console.log("updateOrder", res);
    if (res.code === 200 && res.status !== "error") {
      getOrder();
      setIsEditing(false);
      editClick();
      editedOrderClick();
    }
  };

  const calculateTotalPrice = (orders) => {
    return orders.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const calculateFinalPrice = (orders) => {
    const totalPrice = calculateTotalPrice(orders);
    const taxAmount = (totalPrice * taxRate) / 100;
    return totalPrice + taxAmount;
  };

  const handleAddItem = (newItem) => {
    if (newItem.dishName && newItem.quantity > 0 && newItem.price > 0) {
      const itemIndex = editedOrder.findIndex(
        (item) => item.dishName === newItem.dishName
      );

      if (itemIndex > -1) {
        // Item already exists, increase quantity
        const updatedItems = [...editedOrder];
        updatedItems[itemIndex].quantity += newItem.quantity; // Increase the existing quantity
        setEditedOrder(updatedItems);
      } else {
        // Item does not exist, add new item
        const updatedItems = [
          ...editedOrder,
          { ...newItem }, // Assign a temporary ID
        ];
        setEditedOrder(updatedItems);
      }

      // Reset new item state after adding
      // setNewItem({ dishName: "", quantity: 1, price: 0 });
    } else {
      alert("Please enter valid item details.");
    }
  };

  useEffect(() => {
    if (menuItem) {
      // setNewItem(menuItem);
      handleAddItem(menuItem);
    }
  }, [menuItem]);

  const handleRemoveItem = (index) => {
    const updatedItems = editedOrder.filter((_, i) => i !== index);
    setEditedOrder(updatedItems);
    setIsDeleteModalOpen(false);
    setDeleteIndex(null);
  };

  return (
    <div className="h-screen overflow-y-auto">
      {order && (
        <div className="bg-white py-10 md:py-0 min-h-screen shadow-lg duration-300 transition-all transition-transform transform translate-x-0">
          <div className="p-4 border-b">
            <div className="">
              <button
                className="text-xl mr-2"
                onClick={() => closeOrderDetails()}
              >
                <ArrowLeft />
              </button>
              <div className="flex justify-between items-center">
                <h2 className="sub-header font-bold my-5">Order Details</h2>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      editClick();
                    }}
                    className="bg-primary text-white px-4 py-2 rounded mt-4"
                  >
                    Edit Order
                  </button>
                )}
              </div>
            </div>
            <div className="flex grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Table Num</p>
                <p className="border border-gray-300 p-2 rounded-md">
                  Table {order.table}
                </p>
              </div>
              <div>
                <p className="font-semibold">Order Type</p>
                <p className="border border-gray-300 p-2 rounded-md">
                  {order.orderType}
                </p>
              </div>
              <div>
                <p className=" font-semibold">Order Time</p>
                <p className="border border-gray-300 p-2 rounded-md">
                  <TimestampFormatter timestamp={order.createdAt} />
                </p>
              </div>
              <div>
                <p className=" font-semibold">Order Date</p>
                <p className="border border-gray-300 p-2 rounded-md">{date}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-5">
              <p className="mt-5 mb-3 font-bold text-[20px]">Ordered Dished</p>
              {isEditing && (
                <button
                  className="bg-primary md:hidden text-white px-4 py-2 rounded"
                  onClick={() => mobileEditClick()}
                >
                  Add Dish
                </button>
              )}
            </div>
            <table className="w-full border-b border-gray-500">
              <tbody className="font-semibold">
                {editedOrder.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2">{item.dishName}</td>
                    <td className="p-2 ">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.quantity}
                          min={1}
                          onChange={(e) =>
                            handleQuantityChange(index, e.target.value)
                          }
                          className="border border-gray-300 rounded p-1 w-20"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end">
                        {calculateItemPrice(item)} MMK
                        {isEditing && (
                          // <td className="p-2 text-right">
                          <button
                            onClick={() => (
                              setDeleteIndex(index), setIsDeleteModalOpen(true)
                            )}
                            className="text-red-500 ms-1"
                          >
                            <IoMdTrash size={20} />
                          </button>
                          // </td>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-gray-300">
                  <td className="p-2 font-semibold">SubTotal</td>
                  <td className="p-2 font-semibold"></td>
                  <td className="p-2 font-semibold text-right">
                    {calculateTotalPrice(editedOrder).toLocaleString()} MMK
                  </td>
                </tr>
                <tr className="border-t border-gray-300">
                  <td className="p-2 font-semibold">Gov Taxl</td>
                  <td className="p-2 font-semibold">
                    {isEditing ? (
                      <input
                        type="number"
                        value={taxRate}
                        min={0}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="border border-gray-300 rounded p-1 w-20"
                      />
                    ) : (
                      <p className="font-semibold">{order.tax * 100}%</p>
                    )}
                  </td>
                  <td className="p-2 font-semibold text-right">
                    {calculateTotalPrice(editedOrder) * (taxRate / 100)} MMK
                  </td>
                </tr>
              </tbody>
            </table>
            {/* <div className="flex justify-between w-full mt-2 px-2">
              <p className="font-semibold">Sub Total</p>
              <p className="font-semibold">
                {calculateTotalPrice(editedOrder)} MMK
              </p>
            </div> */}
            {/* <div className="flex justify-between w-full my-2 p-2 border-b border-gray-400">
              <p className="font-semibold">Gov Tax</p>
              {isEditing ? (
                <input
                  type="number"
                  value={taxRate}
                  min={0}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="border border-gray-300 rounded p-1 w-20"
                />
              ) : (
                <p className="font-semibold ms-10">{order.tax * 100}%</p>
              )}
              <p className="font-semibold">
                {calculateTotalPrice(editedOrder) * (taxRate / 100)} MMK
              </p>
            </div> */}
            {/* <div>
              <label htmlFor="taxRate">Tax Rate (%): </label>
              <input
                type="number"
                id="taxRate"
                value={taxRate}
                min={0}
                onChange={(e) => setTaxRate(Number(e.target.value))} // Updating tax rate
                className="border border-gray-300 rounded p-1 w-20"
                disabled={!isEditing} // Disable input when not editing
              />
            </div> */}
            <div className="flex justify-between w-full mt-2 p-2">
              <p className="font-semibold">Final Total</p>
              <p className="font-semibold">
                {calculateFinalPrice(editedOrder).toLocaleString()} MMK
              </p>
            </div>

            {isEditing && (
              <div className="flex justify-between mt-4">
                <button
                  onClick={handleEditSubmit}
                  className="bg-primary text-white px-4 py-2 rounded"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    getOrder();
                    setIsEditing(false);
                    editClick();
                  }}
                  className="border border-primary text-primary px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <DeleteModel
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        submit={() => handleRemoveItem(deleteIndex)}
      />
    </div>
  );
}
OrderDetail.propTypes = {
  id: PropTypes.string.isRequired,
  closeOrderDetails: PropTypes.func.isRequired,
  menuItem: PropTypes.object,
  editClick: PropTypes.func.isRequired,
  editedOrderClick: PropTypes.func.isRequired,
  mobileEditClick: PropTypes.func.isRequired,
};

export default OrderDetail;
