import { useEffect, useState } from "react";
import { format } from "date-fns";
import getAllOrders from "../api/Order/getAllOrders";
import OrderTable from "../components/Orders/OrderTable";
// import { TbReport } from "react-icons/tb";
import Calendar from "../components/Calender";
import deleteOrders from "../api/Order/deleteOrder";
import EditOrder from "./EditOrder";
// import getReport from "../api/report/getReport";
import NoItems from "../components/NoItems";
import Loading from "../components/Loading";
import { Trash2Icon } from "lucide-react";
import DeleteModel from "../components/DeleteModel";

const OrdersPage = () => {
  const date = new Date();
  const formattedDate = format(date, "yyyy-MM-dd");
  const [dataFromChild, setDataFromChild] = useState("");
  const [dataFromCalendar, setDataFromCalendar] = useState({
    startDate: formattedDate,
    endDate: formattedDate,
  });
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Callback function to receive data from child
  const handleDataFromChild = (childData) => {
    setDataFromChild(childData);
    openOrderDetails();
  };

  const getOerderIds = (childData) => {
    // console.log(childData);
    setOrderIds(childData);
  };
  // console.log(orderIds);

  // console.log("dataFromChild", dataFromChild);

  const handleDataFromCalendar = (childData) => {
    setDataFromCalendar(childData);
  };

  const openOrderDetails = () => {
    setOpen(true);
  };

  const closeOrderDetails = () => {
    setOpen(false);
  };

  const handleDeleteOrder = async (id) => {
    // console.log("delete", id);

    const res = await deleteOrders(id);
    // console.log(res.code);
    if (res.code === 200) {
      setLoading(false);
      getOrders();
      closeOrderDetails();
      setIsDeleteOpen(false);
    }
  };

  const handleEditOrder = () => {
    getOrders();
  };

  // const handleDownload = async () => {
  //   const res = await getReport(dataFromCalendar);
  //   console.log(res);
  //   // if (res.code === 200) {
  //   const blob = new Blob([res], { type: "application/pdf" }); // Convert the response to a Blob
  //   const url = window.URL.createObjectURL(blob);

  //   // Open the PDF in a new tab/window
  //   const newWindow = window.open(url);
  //   if (newWindow) {
  //     // Trigger print once the PDF is opened
  //     newWindow.onload = function () {
  //       // newWindow.print();
  //     };
  //   } else {
  //     console.error("Failed to open new window for printing");
  //   }

  //   // }
  // };
  // console.log(orders.length);

  const getOrders = async () => {
    const res = await getAllOrders(dataFromCalendar);

    if (res.code === 200 && res.status !== "error") {
      setLoading(false);
      setOrders(res.data);
    } else {
      setLoading(false);
      setOrders([]);
    }
  };

  useEffect(() => {
    getOrders();
  }, [dataFromCalendar]);

  return (
    <div className="p-5">
      <div className="min-h-screen">
        <div className="md:flex justify-between mb-5">
          <h1 className="sub-header font-bold">Orders Management</h1>
          <div className="flex gap-4">
            <Calendar sendDate={handleDataFromCalendar} />
            <div>
              <button
                disabled={orderIds.length == 0}
                className={`p-2 md:p-4 rounded-md text-white bg-red-500 transition-all duration-300 ease-in-out ${
                  orderIds.length == 0
                    ? "opacity-50"
                    : "hover:scale-95 active:scale-105"
                }`}
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2Icon size={20} />
              </button>
            </div>
          </div>
        </div>
        {loading ? (
          <div>
            <Loading />
          </div>
        ) : (
          <div className="bg-white w-full rounded-lg overflow-hidden">
            {orders && orders.length === 0 ? (
              <div className="flex justify-center items-center mt-20">
                <NoItems header={"No Orders"} subHeader={"No orders found"} />
              </div>
            ) : (
              <OrderTable
                orders={orders}
                sendData={handleDataFromChild}
                setOrderIds={getOerderIds}
                deleteOrder={handleDeleteOrder}
              />
            )}
          </div>
        )}
        {open && (
          <div className="fixed inset-0 flex items-center justify-end z-50">
            <EditOrder
              closeOrderDetails={closeOrderDetails}
              id={dataFromChild}
              editedOrder={handleEditOrder}
            />
          </div>
        )}

        <DeleteModel
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          text="Deleted Orders Cannot be Recovered!"
          submit={() => {
            handleDeleteOrder(orderIds);
          }}
        />
      </div>
    </div>
  );
};

export default OrdersPage;
