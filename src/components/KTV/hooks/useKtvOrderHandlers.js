import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  removeItemFromRoomReceipt,
  incrementRoomItemQuantity,
  decrementRoomItemQuantity,
  removeRoom,
  setItemsForRoom,
  setRoomServiceForRoom,
  setVocalistsForRoom,
  setOrderIdForRoom,
  setRoomStatus,
  setRoomDetails,
  selectRoom,
} from "../../../redux/ktvReceiptSlice";
import getAllRooms from "../../../api/KTV/getAllRooms";
import changeKtvOrderRoom from "../../../api/KTV/changeKtvOrderRoom";
import updateRoomStatus from "../../../api/KTV/updateRoomStatus";
import getKtvOrders from "../../../api/Order/getKtvOrders";
import removeKtvOrderItems from "../../../api/KTV/removeKtvOrderItems";
import updateKtvOrder from "../../../api/KTV/updateKtvOrder";
import sendKtvOrder from "../../../api/KTV/sendKtvOrder";
import finalizeKtvOrder from "../../../api/KTV/finalizeKtvOrder";
import printReceipt from "../../../utils/printReceipt";

export const useKtvOrderHandlers = ({
  selectedRoom,
  receipts,
  orderId,
  setOrderId,
  remoteOrder,
  setRemoteOrder,
  roomServiceId,
  setRoomServiceId,
  setLocalCreationTime,
  selectedRoomId,
  selectedRoomStatus,
  taxRate,
  serviceFee,
  discountAmount,
  subtotal,
  roomCharges,
  vocalistCharges,
  tax,
  serviceFeeAmount,
  total,
  onClose,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Item handlers
  const handleRemoveItem = (itemName) => {
    dispatch(removeItemFromRoomReceipt({ room: selectedRoom, itemName }));
  };

  const handleIncrement = (itemName) => {
    dispatch(incrementRoomItemQuantity({ room: selectedRoom, itemName }));
  };

  const handleDecrement = (itemName) => {
    dispatch(decrementRoomItemQuantity({ room: selectedRoom, itemName }));
  };

  // Room change handlers
  const [isRoomChangeOpen, setIsRoomChangeOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isChangingRoom, setIsChangingRoom] = useState(false);

  const handleOpenRoomChange = async () => {
    if (!orderId) {
      toast.warning("No active order to change room");
      return;
    }
    setIsLoadingRooms(true);
    setIsRoomChangeOpen(true);
    try {
      const res = await getAllRooms();
      if (res?.success && Array.isArray(res.data)) {
        const filteredRooms = res.data.filter(
          (room) => String(room.roomNumber) !== String(selectedRoom)
        );
        setAvailableRooms(filteredRooms);
      } else {
        toast.error("Failed to load available rooms");
        setIsRoomChangeOpen(false);
      }
    } catch (error) {
      toast.error("Failed to load available rooms");
      setIsRoomChangeOpen(false);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleChangeRoom = async (newRoomServiceId, newRoomNumber) => {
    if (!orderId) {
      toast.error("No active order to change room");
      return;
    }

    const originalRoomServiceId =
      roomServiceId || remoteOrder?.roomService?.roomServiceId;

    setIsChangingRoom(true);
    try {
      const res = await changeKtvOrderRoom(orderId, newRoomServiceId);
      if (res?.success) {
        try {
          if (originalRoomServiceId) {
            await updateRoomStatus(originalRoomServiceId, "inactive");
          }
          await updateRoomStatus(newRoomServiceId, "active");
        } catch (statusError) {
          console.error("Error updating room statuses:", statusError);
        }

        toast.success(`Room changed to Room ${newRoomNumber} successfully`);
        dispatch(selectRoom(newRoomNumber));
        setIsRoomChangeOpen(false);
        navigate("/ktv");
      } else {
        toast.error(res?.message || "Failed to change room");
      }
    } catch (error) {
      toast.error("An error occurred while changing room");
    } finally {
      setIsChangingRoom(false);
    }
  };

  // Remove order items handlers
  const [isRemoveOrderOpen, setIsRemoveOrderOpen] = useState(false);
  const [orderItemsForRemove, setOrderItemsForRemove] = useState([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isLoadingRemoveModal, setIsLoadingRemoveModal] = useState(false);

  const handleOpenRemoveOrder = async () => {
    if (!orderId) {
      toast.warning("No active order to remove items from");
      return;
    }

    setIsLoadingRemoveModal(true);
    try {
      const res = await getKtvOrders();
      if (res?.success && Array.isArray(res.data)) {
        const forTable = res.data.filter(
          (o) =>
            String(o.roomService.roomNumber) === String(selectedRoom) &&
            o?.isDeleted === false &&
            (o.status === "pending" ||
              o.status === "ongoing" ||
              o.status === "in_progress")
        );
        const pickLatest = (list) =>
          list
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
          null;
        const chosen = pickLatest(forTable);

        if (!chosen) {
          toast.warning("No active order to remove items from");
          setIsLoadingRemoveModal(false);
          return;
        }

        setRemoteOrder(chosen);
        setOrderId(chosen._id);

        const grouped = new Map();
        (chosen.orderItems || []).forEach((item) => {
          const stockId = item?.stockId?._id || item?.stockId;
          const stockName = item.stockName || item?.stockId?.name || "";
          const price = item.price || 0;
          const qty = item.quantity || 1;
          const orderItemId = item._id;

          if (!stockId) return;

          if (!grouped.has(stockId)) {
            grouped.set(stockId, {
              stockId,
              stockName,
              price,
              quantity: qty,
              originalQuantity: qty,
              orderItemIds: [{ orderItemId, quantity: qty }],
            });
          } else {
            const existing = grouped.get(stockId);
            existing.quantity += qty;
            existing.originalQuantity += qty;
            existing.orderItemIds.push({ orderItemId, quantity: qty });
          }
        });
        setOrderItemsForRemove(Array.from(grouped.values()));
        setIsRemoveOrderOpen(true);
      } else {
        toast.warning("No active order to remove items from");
      }
    } catch (error) {
      toast.error("Failed to fetch order data");
    } finally {
      setIsLoadingRemoveModal(false);
    }
  };

  const handleDecrementInModal = (index) => {
    const updatedItems = [...orderItemsForRemove];
    if (updatedItems[index].quantity > 0) {
      updatedItems[index].quantity -= 1;
    }
    setOrderItemsForRemove(updatedItems);
  };

  const handleIncrementInModal = (index) => {
    const updatedItems = [...orderItemsForRemove];
    if (
      updatedItems[index].quantity < updatedItems[index].originalQuantity
    ) {
      updatedItems[index].quantity += 1;
    }
    setOrderItemsForRemove(updatedItems);
  };

  const handleSaveRemoveOrder = async () => {
    if (!orderId) {
      toast.error("No active order");
      return;
    }

    setIsUpdatingOrder(true);
    try {
      const itemsToRemoveMap = new Map();
      orderItemsForRemove.forEach((item) => {
        const quantityToRemove = item.originalQuantity - item.quantity;
        if (quantityToRemove > 0) {
          let remainingToRemove = quantityToRemove;
          let orderItemIndex = 0;

          while (
            remainingToRemove > 0 &&
            orderItemIndex < item.orderItemIds.length
          ) {
            const orderItem = item.orderItemIds[orderItemIndex];
            const removeFromThisItem = Math.min(
              remainingToRemove,
              orderItem.quantity
            );

            const orderItemId = orderItem.orderItemId;
            if (itemsToRemoveMap.has(orderItemId)) {
              itemsToRemoveMap.set(
                orderItemId,
                itemsToRemoveMap.get(orderItemId) + removeFromThisItem
              );
            } else {
              itemsToRemoveMap.set(orderItemId, removeFromThisItem);
            }

            remainingToRemove -= removeFromThisItem;
            orderItemIndex++;
          }
        }
      });

      const itemsToRemove = Array.from(itemsToRemoveMap.entries()).map(
        ([orderItemId, quantity]) => ({
          orderItemId,
          quantity,
        })
      );

      const res = await removeKtvOrderItems(orderId, itemsToRemove);

      if (res?.success) {
        toast.success(res?.message || "Order items removed successfully");
        setIsRemoveOrderOpen(false);

        if (res?.data) {
          setRemoteOrder({
            ...res?.data,
            createdAt: res?.data?.createdAt || remoteOrder?.createdAt,
          });
          if (res?.data?.orderItems) {
            const grouped = new Map();
            res.data.orderItems.forEach((it) => {
              const key = it?.stockId?._id || it?.stockId;
              const name = it.stockName || it?.stockId?.name || "";
              const price = it.price || 0;
              const qty = it.quantity || 1;
              if (!key) return;
              if (!grouped.has(key)) {
                grouped.set(key, {
                  name,
                  price,
                  quantity: qty,
                  stockId: key,
                  _id: key,
                });
              } else {
                const existing = grouped.get(key);
                existing.quantity += qty;
                existing.price = price || existing.price;
              }
            });
            const mappedItems = Array.from(grouped.values());
            dispatch(
              setItemsForRoom({ room: selectedRoom, items: mappedItems })
            );
          }
        }

        const refreshRes = await getKtvOrders();
        if (refreshRes?.success && Array.isArray(refreshRes.data)) {
          const forTable = refreshRes.data.filter(
            (o) =>
              String(o.roomService.roomNumber) === String(selectedRoom) &&
              o?.isDeleted === false &&
              (o.status === "pending" ||
                o.status === "ongoing" ||
                o.status === "in_progress")
          );
          const pickLatest = (list) =>
            list
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
            null;
          const chosen = pickLatest(forTable);
          if (chosen) {
            setRemoteOrder(chosen);
            setOrderId(chosen._id);
            if (chosen._id && selectedRoom) {
              dispatch(
                setOrderIdForRoom({ room: selectedRoom, orderId: chosen._id })
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error removing order items:", error);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Payment handlers
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const hasLocalItems = !!selectedRoom && !!receipts[selectedRoom]?.items?.length;
  const hasLocalRoomService = !!selectedRoom && !!receipts[selectedRoom]?.roomService;
  const hasLocalVocalists = !!selectedRoom && !!receipts[selectedRoom]?.vocalists?.length;

  const handlePayment = () => {
    if (
      !selectedRoom ||
      (!hasLocalItems && !hasLocalRoomService && !hasLocalVocalists)
    ) {
      return;
    }
    setIsCalculatorOpen(true);
  };

  const handleCalculatorConfirm = async ({ paidPrice, extraChange }) => {
    if (!orderId) {
      toast.error("No active order to checkout");
      return;
    }

    const vocalistServiceTimes = [];
    if (selectedRoom && receipts[selectedRoom]?.vocalists) {
      receipts[selectedRoom].vocalists.forEach((v) => {
        vocalistServiceTimes.push(Number(v.serviceTime) || 0);
      });
    }

    const roomServiceTime =
      selectedRoom && receipts[selectedRoom]?.roomService
        ? Number(receipts[selectedRoom].roomService.serviceTime) || 0
        : 0;

    const payload = {
      vocalistServiceTimes,
      roomServiceTime,
      roomCharges,
      vocalistCharges,
      subTotal: subtotal,
      tax,
      serviceFee: serviceFeeAmount,
      discount: discountAmount,
      total,
      status: "completed",
      paymentMethod: "cash",
    };

    try {
      const res = await finalizeKtvOrder(orderId, payload);
      if (res?.success) {
        toast.success("KTV order checkout completed successfully");
        setIsCalculatorOpen(false);

        const orderForPrint = {
          ...res?.data,
          roomService: res?.data?.roomService || {
            roomNumber: selectedRoom,
          },
          roomNumber: selectedRoom,
          orderItems:
            res?.data?.orderItems ||
            receipts[selectedRoom]?.items?.map((item) => ({
              stockName: item.name,
              name: item.name,
              price: item.price,
              quantity: item.quantity || 1,
              _id: item._id || item.stockId,
            })) ||
            [],
          subTotal: res?.data?.subTotal || subtotal,
          roomCharges: res?.data?.roomCharges || roomCharges,
          vocalistCharges: res?.data?.vocalistCharges || vocalistCharges,
          tax: res?.data?.tax || tax,
          serviceFee: res?.data?.serviceFee || serviceFeeAmount,
          discount: res?.data?.discount || discountAmount,
          total: res?.data?.total || total,
          paymentMethod: "cash",
          createdAt: res?.data?.createdAt || new Date().toISOString(),
          updatedAt: res?.data?.updatedAt || new Date().toISOString(),
          note: receipts[selectedRoom]?.note || "",
        };

        const paperSize = localStorage.getItem("receipt-paper-size") || "57mm";
        printReceipt(orderForPrint, true, paperSize);

        setRemoteOrder(res?.data || null);
        setOrderId(null);
        navigate("/ktv");
        if (roomServiceId) {
          try {
            await updateRoomStatus(roomServiceId, "inactive");
          } catch (error) {
            console.error("Error updating room status:", error);
          }
        }
        if (selectedRoom) {
          dispatch(removeRoom(selectedRoom));
        }

        if (onClose) onClose();
      } else {
        toast.error(res?.message || "Failed to complete checkout");
      }
    } catch (error) {
      console.error("Error completing checkout:", error);
    }
  };

  // Send kitchen handler
  const sendKitchen = async () => {
    const hasItems = receipts[selectedRoom]?.items?.length > 0;
    const hasVocalists = receipts[selectedRoom]?.vocalists?.length > 0;
    const hasRoomServiceUpdates =
      selectedRoom && receipts[selectedRoom]?.roomService;
    if (
      !selectedRoom ||
      (orderId && !hasItems && !hasVocalists && !hasRoomServiceUpdates)
    ) {
      toast.warning("Please add items, vocalists, or room service to send");
      return;
    }

    if (!roomServiceId) {
      toast.error("Room service not found");
      return;
    }

    const localItems = (receipts[selectedRoom]?.items || []).map((item) => ({
      stockId: item._id || item.stockId,
      quantity: item.quantity || 1,
      notes: item.notes ?? "",
      price: item.price,
      name: item.name,
    }));

    const localVocalists = receipts[selectedRoom]?.vocalists || [];

    if (orderId) {
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
      if (res?.success) {
        toast.success("KTV order updated successfully");
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
      const creationTime = new Date().toISOString();
      setLocalCreationTime(creationTime);

      const payload = {
        orderItems:
          localItems.length > 0
            ? localItems.map((it) => ({
                stockId: it.stockId,
                quantity: it.quantity,
                notes: it.notes,
              }))
            : null,
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
      if (res?.success) {
        const hasItemsOrVocalists =
          localItems.length > 0 || localVocalists.length > 0;
        const successMessage = hasItemsOrVocalists
          ? "KTV order sent to kitchen successfully"
          : "Room service initiated successfully";
        toast.success(successMessage);
        const newOrderId = res?.data?._id;
        setOrderId(newOrderId);
        if (res?.data?.roomService?.roomServiceId) {
          const newRoomServiceId = res.data.roomService.roomServiceId;
          setRoomServiceId(newRoomServiceId);
          try {
            await updateRoomStatus(newRoomServiceId, "active");
          } catch (error) {
            console.error("Error updating room status:", error);
          }
        }
        if (newOrderId && selectedRoom) {
          dispatch(
            setOrderIdForRoom({ room: selectedRoom, orderId: newOrderId })
          );
        }
        if (selectedRoom && selectedRoomId && selectedRoomStatus !== "active") {
          try {
            const statusResponse = await updateRoomStatus(
              selectedRoomId,
              "active"
            );
            if (statusResponse?.success) {
              dispatch(
                setRoomStatus({
                  room: selectedRoom,
                  status: statusResponse?.data?.status || "active",
                })
              );
              dispatch(
                setRoomDetails({
                  room: selectedRoom,
                  roomId: selectedRoomId,
                  status: statusResponse?.data?.status || "active",
                })
              );
            } else if (statusResponse?.message) {
              toast.info(statusResponse.message);
            }
          } catch (error) {
            console.error("Error updating room status:", error);
          }
        }

        setRemoteOrder({
          ...res?.data,
          createdAt: res?.data?.createdAt || creationTime,
        });

        if (res?.data?.createdAt) {
          setLocalCreationTime(null);
        }

        if (res?.data?.orderItems) {
          const mappedItems = res.data.orderItems.map((it) => ({
            stockId: it.stockId,
            name: it.stockName,
            price: it.price,
            quantity: it.quantity,
          }));
          dispatch(setItemsForRoom({ room: selectedRoom, items: mappedItems }));
        }

        if (res?.data?.roomService) {
          dispatch(
            setRoomServiceForRoom({
              room: selectedRoom,
              hourlyRate: res.data.roomService.hourlyRate || 0,
              serviceTime: res.data.roomServiceTime || 0,
            })
          );
        }

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

  const handleCloseRoomChange = () => {
    setIsRoomChangeOpen(false);
    setAvailableRooms([]);
  };

  const handleCloseRemoveOrder = () => {
    setIsRemoveOrderOpen(false);
    setOrderItemsForRemove([]);
  };

  const handleCloseCalculator = () => {
    setIsCalculatorOpen(false);
  };

  return {
    // Item handlers
    handleRemoveItem,
    handleIncrement,
    handleDecrement,
    // Room change
    isRoomChangeOpen,
    availableRooms,
    isLoadingRooms,
    isChangingRoom,
    handleOpenRoomChange,
    handleChangeRoom,
    handleCloseRoomChange,
    // Remove items
    isRemoveOrderOpen,
    orderItemsForRemove,
    isUpdatingOrder,
    isLoadingRemoveModal,
    handleOpenRemoveOrder,
    handleDecrementInModal,
    handleIncrementInModal,
    handleSaveRemoveOrder,
    handleCloseRemoveOrder,
    // Payment
    isCalculatorOpen,
    handlePayment,
    handleCalculatorConfirm,
    handleCloseCalculator,
    // Send kitchen
    sendKitchen,
  };
};

