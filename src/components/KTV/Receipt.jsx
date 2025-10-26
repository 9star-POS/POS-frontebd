import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { XCircle, Plus, Minus } from "lucide-react";
import {
  removeItemFromRoomReceipt,
  incrementRoomItemQuantity,
  decrementRoomItemQuantity,
  removeRoom,
  setItemsForRoom,
  setRoomServiceForRoom,
  setVocalistsForRoom,
  incrementRoomServiceTime,
  decrementRoomServiceTime,
  incrementVocalistServiceTime,
  decrementVocalistServiceTime,
} from "./../../redux/ktvReceiptSlice";
import { useNavigate } from "react-router-dom";
import box from "./../../assets/box.png";
import "./../input.css";
import CalculatorModal from "./CalculatorModel";
import sendToKitchen from "../../api/Order/sendtokitchen";
import { toast } from "sonner";
import updateKitchenOrder from "../../api/Order/updatetokitchenorder";
import checkoutOrder from "../../api/Order/checkout";
import getKtvOrders from "../../api/Order/getKtvOrders";

function Receipt({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedRoom = useSelector((state) => state.ktvReceipts.selectedRoom);
  const receipts = useSelector((state) => state.ktvReceipts.receipts);
  const [taxRate, setTaxRate] = useState(5); // Default 5% tax
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [remoteOrder, setRemoteOrder] = useState(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  useEffect(() => {
    const fetchOrdersForTable = async () => {
      if (!selectedRoom) {
        setRemoteOrder(null);
        setOrderId(null);
        return;
      }
      setIsLoadingRemote(true);
      const res = await getKtvOrders();
      console.log(res);
      if (res?.code === 200 && Array.isArray(res.data)) {
        const forTable = res.data.filter(
          (o) =>
            Number(o.roomService.roomNumber) === Number(selectedRoom) &&
            o?.isDeleted === false
        );
        // Prefer active (pending/ongoing/in_progress), otherwise latest by createdAt
        const pickLatest = (list) =>
          list
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
          null;
        const active = forTable.filter(
          (o) =>
            o.status === "pending" ||
            o.status === "ongoing" ||
            o.status === "in_progress"
        );
        const chosen = pickLatest(active.length ? active : forTable);
        setRemoteOrder(chosen || null);
        setOrderId(chosen?._id || null);
        if (chosen?.orderItems?.length) {
          // Group duplicate items (same stock) and sum quantities
          const grouped = new Map();
          chosen.orderItems.forEach((it) => {
            const key = it?.stockId?._id || it?.stockId;
            const name = it.stockName || it?.stockId?.name;
            const price = it.price || 0;
            const qty = it.quantity || 1;
            if (!key) return;
            if (!grouped.has(key)) {
              grouped.set(key, {
                name,
                price,
                quantity: qty,
                stockId: key,
              });
            } else {
              const existing = grouped.get(key);
              existing.quantity += qty;
              // Prefer latest price if it changes
              existing.price = price || existing.price;
            }
          });
          const mappedItems = Array.from(grouped.values());
          dispatch(setItemsForRoom({ room: selectedRoom, items: mappedItems }));
          if (chosen?.roomService) {
            dispatch(
              setRoomServiceForRoom({
                room: selectedRoom,
                hourlyRate: chosen?.roomService?.hourlyRate || 0,
                serviceTime: chosen?.roomServiceTime || 0,
              })
            );
          }
          if (Array.isArray(chosen?.vocalist)) {
            dispatch(
              setVocalistsForRoom({
                room: selectedRoom,
                vocalists: chosen.vocalist,
              })
            );
          }
        } else {
          // No pending order
          dispatch(setItemsForRoom({ room: selectedRoom, items: [] }));
        }
      } else {
        setRemoteOrder(null);
        setOrderId(null);
      }
      setIsLoadingRemote(false);
    };
    fetchOrdersForTable();
  }, [selectedRoom]);

  const handleRemoveItem = (itemName) => {
    dispatch(removeItemFromRoomReceipt({ room: selectedRoom, itemName }));
  };

  const handleIncrement = (itemName) => {
    dispatch(incrementRoomItemQuantity({ room: selectedRoom, itemName }));
  };

  const handleDecrement = (itemName) => {
    dispatch(decrementRoomItemQuantity({ room: selectedRoom, itemName }));
  };

  const handleTaxChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setTaxRate(value === "" ? 0 : Number(value));
    }
  };

  const hasLocalItems =
    !!selectedRoom && !!receipts[selectedRoom]?.items?.length;

  const calculateSubtotal = () => {
    if (remoteOrder?.subTotal != null) return Number(remoteOrder.subTotal) || 0;
    if (!selectedRoom || !hasLocalItems) return 0;
    return receipts[selectedRoom].items.reduce((total, item) => {
      return total + item.price * (item.quantity || 1);
    }, 0);
  };

  const calculateTax = (subtotal) => {
    if (remoteOrder?.tax != null) return Number(remoteOrder.tax) || 0;
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    if (remoteOrder?.total != null) return Number(remoteOrder.total) || 0;
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const handlePayment = () => {
    if (!selectedRoom || !receipts[selectedRoom]?.items?.length) {
      return;
    }

    const orderData = {
      table: selectedRoom,
      orderType: receipts[selectedRoom].orderType,
      orders: receipts[selectedRoom].items.map((item) => ({
        dishName: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      totalPrice: calculateSubtotal(),
      finalPrice: calculateTotal(),
      tax: taxRate / 100,
    };

    setIsCalculatorOpen(true);
  };

  const handleCalculatorConfirm = async ({ paidPrice, extraChange }) => {
    if (!orderId) {
      toast.error("No active order to checkout");
      return;
    }
    const payload = {
      status: "completed",
      subTotal: calculateSubtotal(),
      tax: taxRate,
      discount: 0,
      total: calculateTotal(),
    };
    try {
      const res = await checkoutOrder({ id: orderId, data: payload });
      if (res?.status === "success" || res?.code === 200) {
        toast.success("Checkout completed successfully");
        setIsCalculatorOpen(false);
        setRemoteOrder(res?.data || null);
        setOrderId(null);
        if (selectedRoom) {
          dispatch(removeRoom(selectedRoom));
        }
        if (onClose) onClose();
      }
    } catch (_) {
      // API layer toasts errors
    }
  };

  const sendKitchen = async () => {
    if (!selectedRoom || !receipts[selectedRoom]?.items?.length) {
      toast.warning("No items to send");
      return;
    }

    // Prepare local items snapshot
    const localItems = receipts[selectedRoom].items.map((item) => ({
      stockId: item._id || item.stockId,
      quantity: item.quantity || 1,
      notes: item.notes ?? "",
      price: item.price,
      name: item.name,
    }));

    if (orderId) {
      // Compute delta: only send newly added quantities/items
      const remoteCounts = {};
      (remoteOrder?.orderItems || []).forEach((it) => {
        const key = it?.stockId?._id || it?.stockId;
        const qty = it?.quantity || 1;
        if (key) remoteCounts[key] = (remoteCounts[key] || 0) + qty;
      });

      const deltaItems = [];
      localItems.forEach((it) => {
        const key = it.stockId;
        const prevQty = remoteCounts[key] || 0;
        const addQty = (it.quantity || 0) - prevQty;
        if (addQty > 0) {
          deltaItems.push({ stockId: key, quantity: addQty, notes: it.notes });
        }
      });

      if (deltaItems.length === 0) {
        toast.info("No new items to send");
        return;
      }

      const updatePayload = { orderItems: deltaItems };
      const res = await updateKitchenOrder({
        data: updatePayload,
        id: orderId,
      });
      if (res?.status === "success" || res?.code === 200) {
        toast.success("Order updated in kitchen successfully");
        // Keep baseline in sync to avoid resending the same items
        const syncedOrderItems = localItems.map((it) => ({
          stockId: it.stockId,
          quantity: it.quantity,
          notes: it.notes,
          price: it.price,
          stockName: it.name,
        }));
        setRemoteOrder((prev) => ({
          ...(prev || {}),
          orderItems: syncedOrderItems,
        }));
      }
    } else {
      const payload = {
        tableNumber: selectedRoom,
        orderItems: localItems.map((it) => ({
          stockId: it.stockId,
          quantity: it.quantity,
          notes: it.notes,
        })),
      };
      const res = await sendToKitchen(payload);
      if (res?.status === "success" || res?.code === 201) {
        toast.success("Order sent to kitchen successfully");
        setOrderId(res?.data?._id);
        // Initialize baseline with what we just sent
        const syncedOrderItems = localItems.map((it) => ({
          stockId: it.stockId,
          quantity: it.quantity,
          notes: it.notes,
          price: it.price,
          stockName: it.name,
        }));
        setRemoteOrder((prev) => ({
          ...(prev || {}),
          orderItems: syncedOrderItems,
        }));
      }
    }
  };

  const handleCheckout = async () => {
    if (!orderId) return;
    const payload = {
      status: "completed",
      subTotal: calculateSubtotal(),
      tax: taxRate,
      discount: 0,
      total: calculateTotal(),
    };
    try {
      const res = await checkoutOrder({ id: orderId, data: payload });
      if (res?.status === "success" || res?.code === 200) {
        toast.success("Checkout completed successfully");
        setRemoteOrder(res?.data || null);
        setOrderId(null);
        if (selectedRoom) {
          dispatch(removeRoom(selectedRoom));
        }
        if (onClose) onClose();
      }
    } catch (_) {
      // error handled in API layer
    }
  };

  return (
    <div className="text-black h-screen px-3 pt-0">
      <div className="pt-2">
        <div className="flex justify-between w-full items-center mb-5">
          <p className="sub-header font-bold">Receipt</p>
          <button
            className="md:hidden bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
            onClick={onClose}
          >
            Save
          </button>
        </div>

        {!selectedRoom && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No table selected</p>
          </div>
        )}

        {selectedRoom && !hasLocalItems && !remoteOrder && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No items in receipt</p>
          </div>
        )}

        {selectedRoom && (hasLocalItems || remoteOrder) && (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            {/* <div className="flex justify-between items-center mb-3">
              <p className="text-gray-500">Room {selectedRoom}</p>
              <p className="text-gray-500">
                {receipts[selectedRoom].orderType}
              </p>
            </div> */}

            <div className="flex-1 overflow-y-auto mb-5 space-y-4">
              {receipts[selectedRoom].items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-white py-3 rounded-lg shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.price.toLocaleString()} MMK
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrement(item.name)}
                        className="p-1 rounded-md hover:bg-gray-100 text-primary"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-medium min-w-[24px] text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => handleIncrement(item.name)}
                        className="p-1 rounded-md hover:bg-gray-100 text-primary"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-medium min-w-[100px] text-right">
                      {(item.price * (item.quantity || 1)).toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              ))}

              {remoteOrder?.roomService && (
                <div className="flex justify-between items-center bg-white py-3 rounded-lg shadow-sm px-3">
                  <div className="flex-1">
                    <p className="font-medium">Room Service</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span>
                        {Number(
                          (receipts[selectedRoom]?.roomService?.hourlyRate ??
                            remoteOrder?.roomService?.hourlyRate) ||
                            0
                        ).toLocaleString()}{" "}
                        MMK/hr ·
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <button
                          className="p-1 rounded-md hover:bg-gray-100 text-primary"
                          onClick={() =>
                            dispatch(
                              decrementRoomServiceTime({ room: selectedRoom })
                            )
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-[40px] text-center">
                          {Number(
                            (receipts[selectedRoom]?.roomService?.serviceTime ??
                              remoteOrder?.roomServiceTime) ||
                              0
                          )}{" "}
                          hr
                        </span>
                        <button
                          className="p-1 rounded-md hover:bg-gray-100 text-primary"
                          onClick={() =>
                            dispatch(
                              incrementRoomServiceTime({ room: selectedRoom })
                            )
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </span>
                    </p>
                  </div>
                  <p className="font-medium min-w-[100px] text-right">
                    {(
                      Number(
                        (receipts[selectedRoom]?.roomService?.hourlyRate ??
                          remoteOrder?.roomService?.hourlyRate) ||
                          0
                      ) *
                      Number(
                        (receipts[selectedRoom]?.roomService?.serviceTime ??
                          remoteOrder?.roomServiceTime) ||
                          0
                      )
                    ).toLocaleString()}{" "}
                    MMK
                  </p>
                </div>
              )}

              {Array.isArray(remoteOrder?.vocalist) &&
                remoteOrder.vocalist.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm px-3 py-3">
                    <p className="font-medium mb-2">Vocalists</p>
                    <div className="space-y-2">
                      {(
                        receipts[selectedRoom]?.vocalists ||
                        remoteOrder.vocalist
                      ).map((v, idx) => (
                        <div
                          key={v?._id || idx}
                          className="flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <p className="text-gray-800">
                              {v?.vocalistName || "Vocalist"}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <span>
                                {Number(v?.hourlyRate || 0).toLocaleString()}{" "}
                                MMK/hr ·
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <button
                                  className="p-1 rounded-md hover:bg-gray-100 text-primary"
                                  onClick={() =>
                                    dispatch(
                                      decrementVocalistServiceTime({
                                        room: selectedRoom,
                                        vocalistId: v?.vocalistId,
                                      })
                                    )
                                  }
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="min-w-[40px] text-center">
                                  {Number(v?.serviceTime || 0)} hr
                                </span>
                                <button
                                  className="p-1 rounded-md hover:bg-gray-100 text-primary"
                                  onClick={() =>
                                    dispatch(
                                      incrementVocalistServiceTime({
                                        room: selectedRoom,
                                        vocalistId: v?.vocalistId,
                                      })
                                    )
                                  }
                                >
                                  <Plus size={14} />
                                </button>
                              </span>
                            </p>
                          </div>
                          <p className="font-medium min-w-[100px] text-right">
                            {(
                              Number(v?.hourlyRate || 0) *
                              Number(v?.serviceTime || 0)
                            ).toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="sticky bottom-[0px] bg-white border-t">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">
                    {calculateSubtotal().toLocaleString()} MMK
                  </p>
                </div>

                {remoteOrder ? (
                  <>
                    {typeof remoteOrder.discount === "number" && (
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Discount</p>
                        <p className="font-medium text-gray-600">
                          {Number(remoteOrder.discount || 0).toLocaleString()}{" "}
                          MMK
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Tax</p>
                      <p className="font-medium text-gray-600">
                        {Number(remoteOrder.tax || 0).toLocaleString()} MMK
                      </p>
                    </div>
                    {(remoteOrder.roomCharges ||
                      remoteOrder.vocalistCharges) && (
                      <>
                        {Number(remoteOrder.roomCharges || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <p className="text-gray-600">Room Charges</p>
                            <p className="font-medium text-gray-600">
                              {Number(
                                remoteOrder.roomCharges || 0
                              ).toLocaleString()}{" "}
                              MMK
                            </p>
                          </div>
                        )}
                        {Number(remoteOrder.vocalistCharges || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <p className="text-gray-600">Vocalist Charges</p>
                            <p className="font-medium text-gray-600">
                              {Number(
                                remoteOrder.vocalistCharges || 0
                              ).toLocaleString()}{" "}
                              MMK
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-600">Gov Tax</p>
                      <div className="relative">
                        <input
                          type="text"
                          value={taxRate === 0 ? "" : taxRate}
                          onChange={handleTaxChange}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:border-primary"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-[-22px] top-1/2 transform -translate-y-1/2 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>
                    <p className="font-medium text-gray-600">
                      {calculateTax(calculateSubtotal()).toLocaleString()} MMK
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-bold text-lg">Total</p>
                  <p className="font-bold text-lg text-primary">
                    {calculateTotal().toLocaleString()} MMK
                  </p>
                </div>
              </div>

              {/* <div className="flex gap-3 pb-5">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                >
                  Order More
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-primary text-white font-semibold py-4 rounded-full border border-primary hover:bg-primary/90 transition-colors"
                >
                  Payment
                </button>
              </div> */}
              {hasLocalItems && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={sendKitchen}
                    className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                  >
                    Send to Kitchen
                  </button>
                  {orderId && (
                    <button
                      // onClick={handleCheckout}
                      onClick={handlePayment}
                      className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                    >
                      Checkout
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isCalculatorOpen && (
        <CalculatorModal
          total={calculateTotal()}
          onClose={() => setIsCalculatorOpen(false)}
          onConfirm={handleCalculatorConfirm}
        />
      )}
    </div>
  );
}

export default Receipt;
