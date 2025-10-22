import { useEffect, useState } from "react";
import getAllOrders from "../api/Order/getAllOrders";
import { Link, useParams } from "react-router-dom";

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState([]);

  const getOrders = async () => {
    const res = await getAllOrders();
    if (res.code === 200) {
      setOrder(res.data.find((order) => order._id === id));
    }
  };

  console.log("details", order.orders);

  useEffect(() => {
    getOrders();
  }, []);

  if (!order) {
    return <div>Order not found!</div>;
  }

  return (
    <div className="container mx-auto pt-10 px-20">
      <Link to="/orders" className="text-blue-500 md:mb-4 inline-block">
        Back to Orders
      </Link>
      <h1 className="sub-header font-bold mb-4">Order Details</h1>
      <div className="bg-white shadow-md rounded-lg p-4 text-lg">
        <p>
          <strong>Table:</strong> {order.table}
        </p>
        <p className="my-2">
          <strong>Order Type:</strong> {order.orderType}
        </p>
        <p>
          <strong>Payment Status:</strong>{" "}
          {order.isPaymentConfirmed ? "Confirmed" : "Pending"}
        </p>

        <h2 className="font-bold text-xl mt-10">Items:</h2>
        {order.orders ? (
          <ul className="pl-5 list-disc list-inside">
            {order.orders.map((item) => (
              <li key={item._id} className="flex justify-between py-2 border-b">
                <span className="text-lg">
                  {item.dishName} (x{item.quantity})
                </span>
                <span>{item.price} MMK</span>
              </li>
            ))}
            <li className="flex justify-between py-2 text-expired">
              <span className="text-lg">
                <strong>Total Price:</strong>
              </span>
              <span>
                <strong>{order.totalPrice} MMK</strong>
              </span>
            </li>
          </ul>
        ) : null}

        <div className="mt-5"></div>
      </div>
    </div>
  );
}

export default OrderDetail;
