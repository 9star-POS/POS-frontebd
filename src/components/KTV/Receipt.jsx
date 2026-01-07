import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Minus, Trash2, X } from "lucide-react";
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
  setRoomDetails,
  setRoomStatus,
  setRoomNote,
  selectRoom,
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
import getAllRooms from "../../api/KTV/getAllRooms";
import finalizeKtvOrder from "../../api/KTV/finalizeKtvOrder";
import updateKtvOrder from "../../api/KTV/updateKtvOrder";
import updateRoomStatus from "../../api/KTV/updateRoomStatus";
import removeKtvOrderItems from "../../api/KTV/removeKtvOrderItems";
import changeKtvOrderRoom from "../../api/KTV/changeKtvOrderRoom";
import TimestampFormatter from "../Orders/TimestampFormatter";
import SplitOrderModal from "./SplitOrderModal";
import printReceipt from "../../utils/printReceipt";
import { getUserRole } from "../../utils/getUserRole";

function Receipt({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userRole = getUserRole();
  const selectedRoom = useSelector((state) => state.ktvReceipts.selectedRoom);
  // console.log("selectedRoom", selectedRoom);
  const receipts = useSelector((state) => state.ktvReceipts.receipts);
  const roomDetails = useSelector((state) => state.ktvReceipts.roomDetails);
  const selectedRoomDetails = selectedRoom
    ? roomDetails?.[selectedRoom] || null
    : null;
  const selectedRoomId = selectedRoomDetails?.roomId;
  const selectedRoomStatus = selectedRoomDetails?.status;
  const [taxRate, setTaxRate] = useState(5); // Default 5% tax
  const [serviceFee, setServiceFee] = useState(2); // Default 2% service fee
  const [discountAmount, setDiscountAmount] = useState(0); // Default 0 MMK discount
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [remoteOrder, setRemoteOrder] = useState(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [roomServiceId, setRoomServiceId] = useState(null);
  const [localCreationTime, setLocalCreationTime] = useState(null);

  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [isRemoveOrderOpen, setIsRemoveOrderOpen] = useState(false);
  const [orderItemsForRemove, setOrderItemsForRemove] = useState([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isLoadingRemoveModal, setIsLoadingRemoveModal] = useState(false);
  const [isRoomChangeOpen, setIsRoomChangeOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isChangingRoom, setIsChangingRoom] = useState(false);
  const [paperSize, setPaperSize] = useState(
    () => localStorage.getItem("receipt-paper-size") || "57mm"
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  // console.log("receipts", receipts);
  // Reset payment method when room changes
  useEffect(() => {
    setPaymentMethod("cash"); // Reset to default payment method
  }, [selectedRoom]);

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
      if (res?.success && Array.isArray(res.data)) {
        // Only show active orders (not completed or cancelled)
        const forTable = res.data.filter(
          (o) =>
            String(o.roomService.roomNumber) === String(selectedRoom) &&
            o?.isDeleted === false &&
            (o.status === "pending" ||
              o.status === "ongoing" ||
              o.status === "in_progress")
        );

        console.log("forTable", forTable);
        // Pick the latest active order by createdAt
        const pickLatest = (list) =>
          list
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
          null;
        const chosen = pickLatest(forTable);
        console.log("chosen", chosen);
        setRemoteOrder(chosen || null);
        console.log("remoteOrder", remoteOrder);
        const chosenOrderId = chosen?._id || null;
        console.log("chosenOrderId", chosenOrderId);
        setOrderId(chosenOrderId);
        if (chosenOrderId && selectedRoom) {
          console.log("setting orderId for room", selectedRoom, chosenOrderId);
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
          console.log("mappedItems", mappedItems);
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

  // Reset roomServiceId and localCreationTime when room changes
  useEffect(() => {
    setRoomServiceId(null);
    setLocalCreationTime(null);
  }, [selectedRoom]);

  // Fetch room service ID when room is selected and no order exists
  useEffect(() => {
    const fetchRoomService = async () => {
      // Only fetch if we have a room, no active order, and no roomServiceId yet
      if (!selectedRoom || orderId || roomServiceId) return;
      const res = await getRoomService(selectedRoom);
      // console.log("room service id", res);
      if (res?.success && res?.data?._id) {
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
  // console.log("room service id", roomServiceId);

  const handleRemoveItem = (itemName) => {
    dispatch(removeItemFromRoomReceipt({ room: selectedRoom, itemName }));
  };

  const handleIncrement = (itemName) => {
    dispatch(incrementRoomItemQuantity({ room: selectedRoom, itemName }));
  };

  const handleDecrement = (itemName) => {
    dispatch(decrementRoomItemQuantity({ room: selectedRoom, itemName }));
  };

  const handleOpenRemoveOrder = async () => {
    if (!orderId) {
      toast.warning("No active order to remove items from");
      return;
    }

    // Refetch order data to ensure we have the latest orderItemIds
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

        // Update remote order with latest data
        setRemoteOrder(chosen);
        const latestOrderId = chosen._id;
        setOrderId(latestOrderId);

        // Group items by stockId and combine quantities
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
              stockId: stockId,
              stockName: stockName,
              price: price,
              quantity: qty,
              originalQuantity: qty,
              orderItemIds: [{ orderItemId, quantity: qty }], // Track individual order items
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
      // console.error("Error fetching order data:", error);
      toast.error("Failed to fetch order data");
    } finally {
      setIsLoadingRemoveModal(false);
    }
  };

  const handleCloseRemoveOrder = () => {
    setIsRemoveOrderOpen(false);
    setOrderItemsForRemove([]);
  };

  // Handle room change modal
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
        // Filter out the current room
        const filteredRooms = res.data.filter(
          (room) =>
            String(room.roomNumber) !== String(selectedRoom) &&
            room.status === "inactive"
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

  const handleCloseRoomChange = () => {
    setIsRoomChangeOpen(false);
    setAvailableRooms([]);
  };

  const handleChangeRoom = async (newRoomServiceId, newRoomNumber) => {
    if (!orderId) {
      toast.error("No active order to change room");
      return;
    }

    // Store the original room's roomServiceId before changing
    const originalRoomServiceId =
      roomServiceId || remoteOrder?.roomService?.roomServiceId;

    setIsChangingRoom(true);
    try {
      const res = await changeKtvOrderRoom(orderId, newRoomServiceId);
      if (res?.success) {
        // Update room statuses: original room to inactive, new room to active
        try {
          // Set original room to inactive
          if (originalRoomServiceId) {
            await updateRoomStatus(originalRoomServiceId, "inactive");
          }
          // Set new room to active
          await updateRoomStatus(newRoomServiceId, "active");
        } catch (statusError) {
          console.error("Error updating room statuses:", statusError);
          // Don't fail the entire operation if status update fails
        }

        toast.success(`Room changed to Room ${newRoomNumber} successfully`);

        // Update Redux state - select the new room
        dispatch(selectRoom(newRoomNumber));

        handleCloseRoomChange();

        // Redirect to /ktv page
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

  const handleDecrementInModal = (index) => {
    const updatedItems = [...orderItemsForRemove];
    if (updatedItems[index].quantity > 0) {
      updatedItems[index].quantity -= 1;
    }
    // Keep item in list even if quantity is 0, so it remains visible
    setOrderItemsForRemove(updatedItems);
  };

  const handleIncrementInModal = (index) => {
    const updatedItems = [...orderItemsForRemove];
    if (updatedItems[index].quantity < updatedItems[index].originalQuantity) {
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
      // Build array of items to remove with orderItemId and quantity
      // Group by orderItemId and sum quantities
      const itemsToRemoveMap = new Map();

      // Calculate items to remove
      orderItemsForRemove.forEach((item) => {
        const quantityToRemove = item.originalQuantity - item.quantity;
        if (quantityToRemove > 0) {
          // Distribute removal across orderItemIds
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

            // Sum quantities for the same orderItemId
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

      // Convert map to array format
      const itemsToRemove = Array.from(itemsToRemoveMap.entries()).map(
        ([orderItemId, quantity]) => ({
          orderItemId,
          quantity,
        })
      );

      // console.log("itemsToRemove", itemsToRemove);

      const res = await removeKtvOrderItems(orderId, itemsToRemove);

      if (res?.success) {
        toast.success(res?.message || "Order items removed successfully");
        handleCloseRemoveOrder();

        // Refresh the order data
        if (res?.data) {
          setRemoteOrder({
            ...res?.data,
            createdAt: res?.data?.createdAt || remoteOrder?.createdAt,
          });
          // Sync items from server response
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

        // Refetch orders to sync
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
              .sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )[0] || null;
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
      // console.error("Error updating order:", error);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleTaxChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setTaxRate(value === "" ? 0 : Number(value));
    }
  };

  const handleServiceFeeChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setServiceFee(value === "" ? 0 : Number(value));
    }
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && !isNaN(Number(value)))) {
      setDiscountAmount(value === "" ? 0 : Number(value));
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

  // Calculate how much quantity of an item has been sent to kitchen
  const getSentQuantity = (item) => {
    if (!remoteOrder?.orderItems || !orderId) return 0;
    const stockId = item._id || item.stockId;
    if (!stockId) return 0;

    // Sum up all quantities for this stockId in remote order
    let sentQty = 0;
    remoteOrder.orderItems.forEach((remoteItem) => {
      const remoteStockId = remoteItem?.stockId?._id || remoteItem?.stockId;
      if (remoteStockId === stockId) {
        sentQty += remoteItem.quantity || 1;
      }
    });
    return sentQty;
  };

  // Calculate local (unsent) quantity for an item
  const getLocalQuantity = (item) => {
    const currentQty = item.quantity || 1;
    const sentQty = getSentQuantity(item);
    return Math.max(0, currentQty - sentQty);
  };

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

  const calculateServiceFee = () => {
    if (remoteOrder?.serviceFee != null)
      return Number(remoteOrder.serviceFee) || 0;
    // Service fee applies to subtotal + room charges + vocalist charges (same base as tax)
    const subtotal = calculateSubtotal();
    const roomCharges = calculateRoomCharges();
    const vocalistCharges = calculateVocalistCharges();
    const baseAmount = subtotal + roomCharges + vocalistCharges;
    return baseAmount * (serviceFee / 100);
  };

  const calculateDiscount = () => {
    // Return the fixed discount amount in MMK
    return discountAmount || 0;
  };

  const calculateTotal = () => {
    if (remoteOrder?.total != null) return Number(remoteOrder.total) || 0;
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const serviceFeeAmount = calculateServiceFee();
    const discount = calculateDiscount();
    const roomCharges = calculateRoomCharges();
    const vocalistCharges = calculateVocalistCharges();
    return (
      subtotal +
      tax +
      serviceFeeAmount -
      discount +
      roomCharges +
      vocalistCharges
    );
  };

  const handlePayment = () => {
    // Allow checkout if we have a room selected and either items, room service, or vocalists
    if (
      !selectedRoom ||
      (!hasLocalItems && !hasLocalRoomService && !hasLocalVocalists)
    ) {
      return;
    }

    const orderData = {
      table: selectedRoom,
      orderType: receipts[selectedRoom]?.orderType || "KTV",
      orders: (receipts[selectedRoom]?.items || []).map((item) => ({
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
      serviceFee: calculateServiceFee(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      status: "completed",
      paymentMethod: paymentMethod,
    };

    try {
      const res = await finalizeKtvOrder(orderId, payload);
      // console.log(res);
      if (res?.success) {
        toast.success("KTV order checkout completed successfully");
        setIsCalculatorOpen(false);

        // Prepare order data for printing
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
          subTotal: res?.data?.subTotal || calculateSubtotal(),
          roomCharges: res?.data?.roomCharges || calculateRoomCharges(),
          vocalistCharges:
            res?.data?.vocalistCharges || calculateVocalistCharges(),
          tax: res?.data?.tax || calculateTax(),
          serviceFee: res?.data?.serviceFee || calculateServiceFee(),
          discount: res?.data?.discount || calculateDiscount(),
          total: res?.data?.total || calculateTotal(),
          paymentMethod: res?.data?.paymentMethod || paymentMethod,
          createdAt: res?.data?.createdAt || new Date().toISOString(),
          updatedAt: res?.data?.updatedAt || new Date().toISOString(),
          note: receipts[selectedRoom]?.note || "",
        };

        // Print receipt
        const paperSize = localStorage.getItem("receipt-paper-size") || "57mm";
        printReceipt(orderForPrint, true, paperSize);

        setRemoteOrder(res?.data || null);
        setOrderId(null);
        navigate("/ktv");
        if (roomServiceId) {
          try {
            await updateRoomStatus(roomServiceId, "inactive");
          } catch (error) {
            // console.error("Failed to reset room status:", error);
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
      // console.log(error);
      // toast.error("An error occurred during checkout");
    }
  };

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
      if (res?.success) {
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
      // Set creation time immediately for immediate display
      const creationTime = new Date().toISOString();
      setLocalCreationTime(creationTime);

      // Create new KTV order
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
            // console.error("Failed to update room status", error);
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
            // console.log(statusResponse);
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
            // console.error("Failed to update room status", error);
          }
        }

        // Update remote order state with full response
        setRemoteOrder({
          ...res?.data,
          createdAt: res?.data?.createdAt || creationTime,
        });

        // Clear local creation time since we now have remote data
        if (res?.data?.createdAt) {
          setLocalCreationTime(null);
        }

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

  return (
    <div className="text-black h-screen px-3 pt-0">
      <div className="pt-2 h-full">
        <div className="flex justify-between w-full items-center mb-5">
          <p className="sub-header font-bold">Receipt</p>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              onClick={onClose}
            >
              Save
            </button>
            {hasLocalItems && (
              <button
                onClick={() => setIsSplitOpen(true)}
                className="bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                Split Order
              </button>
            )}
          </div>
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
            <div className="flex justify-between items-center mb-3 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-gray-800 font-medium">
                    Room {selectedRoom}
                  </p>
                  {(remoteOrder?.createdAt || localCreationTime) && (
                    <p className="text-gray-500 text-sm">
                      Started:{" "}
                      <TimestampFormatter
                        timestamp={remoteOrder?.createdAt || localCreationTime}
                      />
                    </p>
                  )}
                </div>
                {orderId && (
                  <button
                    onClick={handleOpenRoomChange}
                    className="text-primary hover:text-primary/80 text-xs font-semibold px-3 py-1 border border-primary rounded-md hover:bg-primary/10 transition-colors"
                    title="Change Room"
                  >
                    Change Room
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">
                  {receipts[selectedRoom]?.orderType || "KTV"}
                </p>
                {(remoteOrder?.createdAt || localCreationTime) && (
                  <p className="text-gray-500 text-sm">
                    {new Date(
                      remoteOrder?.createdAt || localCreationTime
                    ).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            </div>

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
                      {(() => {
                        const localQty = getLocalQuantity(item);
                        const hasLocalQuantity = localQty > 0;
                        return (
                          <>
                            {hasLocalQuantity && (
                              <button
                                onClick={() => handleDecrement(item.name)}
                                className="p-1 rounded-md hover:bg-gray-100 text-primary"
                              >
                                <Minus size={16} />
                              </button>
                            )}
                            <span className="font-medium min-w-[24px] text-center">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => handleIncrement(item.name)}
                              className="p-1 rounded-md hover:bg-gray-100 text-primary"
                            >
                              <Plus size={16} />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                    <p className="font-medium min-w-[100px] text-right">
                      {(item.price * (item.quantity || 1)).toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              ))}

              {(receipts[selectedRoom]?.roomService ||
                remoteOrder?.roomService) && (
                <div className="flex justify-between items-center bg-white py-3 rounded-lg shadow-sm">
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
                <div className="bg-white rounded-lg shadow-sm py-3">
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

            <div className="sticky bottom-[-150px] lg:bottom-[0] pb-2 bg-white border-t pt-3">
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
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Room Charges</p>
                      <p className="font-medium text-gray-600">
                        {calculateRoomCharges().toLocaleString()} MMK
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Add note..."
                      value={receipts[selectedRoom]?.note || ""}
                      onChange={(e) =>
                        dispatch(
                          setRoomNote({
                            room: selectedRoom,
                            note: e.target.value,
                          })
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                    />
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
                        value={taxRate === 0 ? "0" : taxRate}
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

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">Service Fee</p>
                    <div className="relative">
                      <input
                        type="text"
                        value={serviceFee === 0 ? "" : serviceFee}
                        onChange={handleServiceFeeChange}
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
                    {calculateServiceFee().toLocaleString()} MMK
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Discount</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={discountAmount === 0 ? "" : discountAmount}
                      onChange={handleDiscountChange}
                      className="w-28 px-3 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:border-primary font-medium"
                      placeholder="0"
                    />
                    <span className="text-gray-600 text-sm">MMK</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-bold text-lg">Total</p>
                  <p className="font-bold text-lg text-primary">
                    {calculateTotal().toLocaleString()} MMK
                  </p>
                </div>
              </div>

              {(hasLocalItems || roomServiceId || orderId) && (
                <div className="flex flex-col gap-3 ">
                  <div
                    className={`flex gap-3 ${
                      userRole === "ktv-waiter" ? "flex-col" : "flex-row"
                    }`}
                  >
                    <button
                      onClick={sendKitchen}
                      className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                    >
                      Send for Preparation
                    </button>
                    {orderId && (
                      <button
                        onClick={handleOpenRemoveOrder}
                        disabled={isLoadingRemoveModal}
                        className={`flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary transition-colors ${
                          isLoadingRemoveModal
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {isLoadingRemoveModal ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </span>
                        ) : (
                          "Remove Items"
                        )}
                      </button>
                    )}
                  </div>

                  {orderId && userRole !== "ktv-waiter" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary bg-white"
                          required
                        >
                          <option value="cash">Cash</option>
                          <option value="kpay">KPay</option>
                          <option value="wavepay">WavePay</option>
                        </select>
                      </div>
                      <button
                        // onClick={handleCheckout}
                        onClick={handlePayment}
                        className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                      >
                        Checkout
                      </button>
                    </>
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
      {isSplitOpen && (
        <SplitOrderModal
          isOpen={isSplitOpen}
          onClose={() => setIsSplitOpen(false)}
          items={receipts[selectedRoom]?.items || []}
          currency="MMK"
        />
      )}

      {/* Remove Order Items Modal */}
      {isRemoveOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold">Remove Items from Order</h3>
              <button
                onClick={handleCloseRemoveOrder}
                className="text-gray-500 hover:text-gray-700"
                disabled={isUpdatingOrder}
              >
                <X size={20} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5">
              {orderItemsForRemove.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items in order
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItemsForRemove.map((item, index) => (
                    <div
                      key={`${item.stockId}-${index}`}
                      className="flex justify-between items-center py-3 px-4 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.stockName}</p>
                        <p className="text-sm text-gray-500">
                          {item.price.toLocaleString()} MMK
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrementInModal(index)}
                            className="p-1 rounded-md hover:bg-gray-200 text-primary"
                            disabled={item.quantity <= 0 || isUpdatingOrder}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-medium min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrementInModal(index)}
                            className="p-1 rounded-md hover:bg-gray-200 text-primary"
                            disabled={
                              isUpdatingOrder ||
                              item.quantity >= item.originalQuantity
                            }
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="font-medium min-w-[100px] text-right">
                          {(item.price * item.quantity).toLocaleString()} MMK
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-5">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseRemoveOrder}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isUpdatingOrder}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRemoveOrder}
                  disabled={isUpdatingOrder || orderItemsForRemove.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    isUpdatingOrder || orderItemsForRemove.length === 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isUpdatingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Room Modal */}
      {isRoomChangeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold">Change Room</h3>
              <button
                onClick={handleCloseRoomChange}
                className="text-gray-500 hover:text-gray-700"
                disabled={isChangingRoom}
              >
                <X size={20} />
              </button>
            </div>

            {/* Rooms List */}
            <div className="flex-1 overflow-y-auto p-5">
              {isLoadingRooms ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading rooms...</p>
                </div>
              ) : availableRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available rooms
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    Select a room to move this order to:
                  </p>
                  {availableRooms.map((room) => (
                    <button
                      key={room._id}
                      onClick={() =>
                        handleChangeRoom(room._id, room.roomNumber)
                      }
                      disabled={isChangingRoom}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        isChangingRoom
                          ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                          : "bg-white border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">
                            Room {room.roomNumber}
                          </p>
                          {room.status && (
                            <p className="text-sm text-gray-500 capitalize">
                              Status: {room.status}
                            </p>
                          )}
                        </div>
                        {room.hourlyRate && (
                          <p className="text-sm text-gray-600">
                            {room.hourlyRate.toLocaleString()} MMK/hr
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseRoomChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  disabled={isChangingRoom}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receipt;
