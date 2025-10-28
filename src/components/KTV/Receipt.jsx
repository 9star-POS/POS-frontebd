import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { XCircle, Plus, Minus, Trash2 } from "lucide-react";
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
  removeVocalistFromRoom,
  setOrderIdForRoom,
} from "./../../redux/ktvReceiptSlice";
import { useNavigate } from "react-router-dom";
import box from "./../../assets/box.png";
import "./../input.css";
import CalculatorModal from "./CalculatorModel";
import { toast } from "sonner";
// import checkoutOrder from "../../api/Order/checkout";
import getKtvOrders from "../../api/Order/getKtvOrders";
import sendKtvOrder from "../../api/KTV/sendKtvOrder";
import getRoomService from "../../api/KTV/getRoomService";
import finalizeKtvOrder from "../../api/KTV/finalizeKtvOrder";
import updateKtvOrder from "../../api/KTV/updateKtvOrder";

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
  const [roomServiceId, setRoomServiceId] = useState(null);

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
        // Only show active orders (not completed or cancelled)
        const forTable = res.data.filter(
          (o) =>
            Number(o.roomService.roomNumber) === Number(selectedRoom) &&
            o?.isDeleted === false &&
            (o.status === "pending" ||
              o.status === "ongoing" ||
              o.status === "in_progress")
        );
        // Pick the latest active order by createdAt
        const pickLatest = (list) =>
          list
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
          null;
        const chosen = pickLatest(forTable);
        setRemoteOrder(chosen || null);
        const chosenOrderId = chosen?._id || null;
        setOrderId(chosenOrderId);
        if (chosenOrderId && selectedRoom) {
          dispatch(
            setOrderIdForRoom({ room: selectedRoom, orderId: chosenOrderId })
          );
        }
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
            setRoomServiceId(chosen.roomService.roomServiceId);
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
          // No active order - clear all Redux state for this room
          dispatch(setItemsForRoom({ room: selectedRoom, items: [] }));
          dispatch(
            setRoomServiceForRoom({
              room: selectedRoom,
              hourlyRate: 0,
              serviceTime: 0,
            })
          );
          dispatch(setVocalistsForRoom({ room: selectedRoom, vocalists: [] }));
          setRoomServiceId(null);
        }
      } else {
        setRemoteOrder(null);
        setOrderId(null);
      }
      setIsLoadingRemote(false);
    };
    fetchOrdersForTable();
  }, [selectedRoom]);

  // Reset roomServiceId when room changes
  useEffect(() => {
    setRoomServiceId(null);
  }, [selectedRoom]);

  // Fetch room service ID when room is selected and no order exists
  useEffect(() => {
    const fetchRoomService = async () => {
      // Only fetch if we have a room, no active order, and no roomServiceId yet
      if (!selectedRoom || orderId || roomServiceId) return;
      const res = await getRoomService(selectedRoom);
      if (res?.code === 200 && res?.data?._id) {
        setRoomServiceId(res.data._id);
        // Initialize room service in state only if no order exists
        if (!orderId) {
          dispatch(
            setRoomServiceForRoom({
              room: selectedRoom,
              hourlyRate: res.data.hourlyRate || 0,
              serviceTime: 0,
            })
          );
        }
      }
    };
    fetchRoomService();
  }, [selectedRoom, orderId, roomServiceId]);

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

  const hasLocalVocalists =
    !!selectedRoom && !!receipts[selectedRoom]?.vocalists?.length;

  const hasLocalRoomService =
    !!selectedRoom && !!receipts[selectedRoom]?.roomService;

  const hasLocalData =
    hasLocalItems || hasLocalVocalists || hasLocalRoomService;

  const calculateSubtotal = () => {
    if (remoteOrder?.subTotal != null) return Number(remoteOrder.subTotal) || 0;
    if (!selectedRoom || !hasLocalItems) return 0;
    return receipts[selectedRoom].items.reduce((total, item) => {
      return total + item.price * (item.quantity || 1);
    }, 0);
  };

  const calculateRoomCharges = () => {
    if (remoteOrder?.roomCharges != null) {
      return Number(remoteOrder.roomCharges) || 0;
    }
    // Calculate from local state
    if (selectedRoom && receipts[selectedRoom]?.roomService) {
      const hourlyRate =
        Number(receipts[selectedRoom].roomService.hourlyRate) || 0;
      const serviceTime =
        Number(receipts[selectedRoom].roomService.serviceTime) || 0;
      return hourlyRate * serviceTime;
    }
    return 0;
  };

  const calculateVocalistCharges = () => {
    if (remoteOrder?.vocalistCharges != null) {
      return Number(remoteOrder.vocalistCharges) || 0;
    }
    // Calculate from local state
    if (selectedRoom && receipts[selectedRoom]?.vocalists) {
      return receipts[selectedRoom].vocalists.reduce((total, v) => {
        const hourlyRate = Number(v.hourlyRate) || 0;
        const serviceTime = Number(v.serviceTime) || 0;
        return total + hourlyRate * serviceTime;
      }, 0);
    }
    return 0;
  };

  const calculateTax = () => {
    if (remoteOrder?.tax != null) return Number(remoteOrder.tax) || 0;
    // Tax applies to subtotal + room charges + vocalist charges
    const subtotal = calculateSubtotal();
    const roomCharges = calculateRoomCharges();
    const vocalistCharges = calculateVocalistCharges();
    const baseAmount = subtotal + roomCharges + vocalistCharges;
    return baseAmount * (taxRate / 100);
  };

  const calculateTotal = () => {
    if (remoteOrder?.total != null) return Number(remoteOrder.total) || 0;
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const roomCharges = calculateRoomCharges();
    const vocalistCharges = calculateVocalistCharges();
    return subtotal + tax + roomCharges + vocalistCharges;
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

    // Prepare vocalist service times array
    const vocalistServiceTimes = [];
    if (selectedRoom && receipts[selectedRoom]?.vocalists) {
      receipts[selectedRoom].vocalists.forEach((v) => {
        vocalistServiceTimes.push(Number(v.serviceTime) || 0);
      });
    }

    // Prepare room service time
    const roomServiceTime =
      selectedRoom && receipts[selectedRoom]?.roomService
        ? Number(receipts[selectedRoom].roomService.serviceTime) || 0
        : 0;

    const payload = {
      vocalistServiceTimes,
      roomServiceTime,
      roomCharges: calculateRoomCharges(),
      vocalistCharges: calculateVocalistCharges(),
      subTotal: calculateSubtotal(),
      tax: calculateTax(),
      discount: 0,
      total: calculateTotal(),
      status: "completed",
      paymentMethod: "cash", // Can be extended to support other payment methods
    };

    try {
      const res = await finalizeKtvOrder(orderId, payload);
      console.log(res);
      if (res?.status === "success" || res?.code === 200) {
        toast.success("KTV order checkout completed successfully");
        setIsCalculatorOpen(false);
        setRemoteOrder(res?.data || null);
        setOrderId(null);
        navigate("/ktv");
        if (selectedRoom) {
          dispatch(removeRoom(selectedRoom));
        }
        if (onClose) onClose();
      } else {
        toast.error(res?.message || "Failed to complete checkout");
      }
    } catch (error) {
      console.log(error);
      // toast.error("An error occurred during checkout");
    }
  };

  const sendKitchen = async () => {
    const hasItems = receipts[selectedRoom]?.items?.length > 0;
    const hasVocalists = receipts[selectedRoom]?.vocalists?.length > 0;

    if (!selectedRoom || (!hasItems && !hasVocalists)) {
      toast.warning("Please add items or vocalists to send");
      return;
    }

    if (!roomServiceId) {
      toast.error("Room service not found");
      return;
    }

    // Prepare local items snapshot (can be empty array)
    const localItems = (receipts[selectedRoom]?.items || []).map((item) => ({
      stockId: item._id || item.stockId,
      quantity: item.quantity || 1,
      notes: item.notes ?? "",
      price: item.price,
      name: item.name,
    }));

    // Get vocalists
    const localVocalists = receipts[selectedRoom]?.vocalists || [];

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
      const res = await updateKtvOrder({
        data: updatePayload,
        id: orderId,
      });
      if (res?.status === "success" || res?.code === 200) {
        toast.success("KTV order updated successfully");
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
      // Create new KTV order
      const payload = {
        orderItems: localItems.map((it) => ({
          stockId: it.stockId,
          quantity: it.quantity,
          notes: it.notes,
        })),
        roomService: {
          roomServiceId: roomServiceId,
        },
        vocalist:
          localVocalists.length > 0
            ? localVocalists.map((v) => ({
                vocalistId: v.vocalistId,
              }))
            : null,
      };

      const res = await sendKtvOrder(payload);
      if (res?.status === "success" || res?.code === 201) {
        toast.success("KTV order sent to kitchen successfully");
        const newOrderId = res?.data?._id;
        setOrderId(newOrderId);
        setRoomServiceId(res?.data?.roomService?.roomServiceId);
        if (newOrderId && selectedRoom) {
          dispatch(
            setOrderIdForRoom({ room: selectedRoom, orderId: newOrderId })
          );
        }

        // Update remote order state with full response
        setRemoteOrder(res?.data);

        // Sync local state with server response
        if (res?.data?.orderItems) {
          const mappedItems = res.data.orderItems.map((it) => ({
            stockId: it.stockId,
            name: it.stockName,
            price: it.price,
            quantity: it.quantity,
          }));
          dispatch(setItemsForRoom({ room: selectedRoom, items: mappedItems }));
        }

        // Sync room service
        if (res?.data?.roomService) {
          dispatch(
            setRoomServiceForRoom({
              room: selectedRoom,
              hourlyRate: res.data.roomService.hourlyRate || 0,
              serviceTime: res.data.roomServiceTime || 0,
            })
          );
        }

        // Sync vocalists
        if (Array.isArray(res?.data?.vocalist)) {
          dispatch(
            setVocalistsForRoom({
              room: selectedRoom,
              vocalists: res.data.vocalist,
            })
          );
        }
      }
    }
  };

  // const handleCheckout = async () => {
  //   if (!orderId) {
  //     toast.error("No active order to checkout");
  //     return;
  //   }

  //   // Prepare vocalist service times array
  //   const vocalistServiceTimes = [];
  //   if (selectedRoom && receipts[selectedRoom]?.vocalists) {
  //     receipts[selectedRoom].vocalists.forEach((v) => {
  //       vocalistServiceTimes.push(Number(v.serviceTime) || 0);
  //     });
  //   }

  //   // Prepare room service time
  //   const roomServiceTime =
  //     selectedRoom && receipts[selectedRoom]?.roomService
  //       ? Number(receipts[selectedRoom].roomService.serviceTime) || 0
  //       : 0;

  //   const payload = {
  //     vocalistServiceTimes,
  //     roomServiceTime,
  //     roomCharges: calculateRoomCharges(),
  //     vocalistCharges: calculateVocalistCharges(),
  //     subTotal: calculateSubtotal(),
  //     tax: calculateTax(),
  //     discount: 0,
  //     total: calculateTotal(),
  //     status: "completed",
  //     paymentMethod: "cash",
  //   };

  //   try {
  //     const res = await finalizeKtvOrder(orderId, payload);
  //     console.log(res);
  //     if (res?.status === "success" || res?.code === 200) {
  //       toast.success("KTV order checkout completed successfully");
  //       setRemoteOrder(res?.data || null);
  //       setOrderId(null);
  //       if (selectedRoom) {
  //         dispatch(removeRoom(selectedRoom));
  //       }
  //       if (onClose) onClose();
  //     } else {
  //       toast.error(res?.message || "Failed to complete checkout");
  //     }
  //   } catch (_) {
  //     toast.error("An error occurred during checkout");
  //   }
  // };

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

        {selectedRoom && !hasLocalData && !remoteOrder && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No items in receipt</p>
          </div>
        )}

        {selectedRoom && (hasLocalData || remoteOrder) && (
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

              {(receipts[selectedRoom]?.roomService ||
                remoteOrder?.roomService) && (
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

              {(receipts[selectedRoom]?.vocalists?.length > 0 ||
                (Array.isArray(remoteOrder?.vocalist) &&
                  remoteOrder.vocalist.length > 0)) && (
                <div className="bg-white rounded-lg shadow-sm px-3 py-3">
                  <p className="font-medium mb-2">Vocalists</p>
                  <div className="space-y-2">
                    {(
                      receipts[selectedRoom]?.vocalists ||
                      remoteOrder?.vocalist ||
                      []
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium min-w-[80px] text-right">
                            {(
                              Number(v?.hourlyRate || 0) *
                              Number(v?.serviceTime || 0)
                            ).toLocaleString()}{" "}
                            MMK
                          </p>
                          <button
                            className="p-1 rounded-md hover:bg-red-100 text-red-500"
                            onClick={() =>
                              dispatch(
                                removeVocalistFromRoom({
                                  room: selectedRoom,
                                  vocalistId: v?.vocalistId,
                                })
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-[0px] bg-white border-t pt-3">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">
                    {calculateSubtotal().toLocaleString()} MMK
                  </p>
                </div>

                {remoteOrder && typeof remoteOrder.discount === "number" && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Discount</p>
                    <p className="font-medium text-gray-600">
                      {Number(remoteOrder.discount || 0).toLocaleString()} MMK
                    </p>
                  </div>
                )}

                {calculateRoomCharges() > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Room Charges</p>
                    <p className="font-medium text-gray-600">
                      {calculateRoomCharges().toLocaleString()} MMK
                    </p>
                  </div>
                )}

                {calculateVocalistCharges() > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Vocalist Charges</p>
                    <p className="font-medium text-gray-600">
                      {calculateVocalistCharges().toLocaleString()} MMK
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center border-t pt-3">
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
                    {calculateTax().toLocaleString()} MMK
                  </p>
                </div>

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
