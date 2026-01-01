import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setItemsForRoom,
  setRoomServiceForRoom,
  setVocalistsForRoom,
  setOrderIdForRoom,
} from "../../../redux/ktvReceiptSlice";
import getKtvOrders from "../../../api/Order/getKtvOrders";

export const useKtvOrder = (selectedRoom) => {
  const dispatch = useDispatch();
  const [orderId, setOrderId] = useState(null);
  const [remoteOrder, setRemoteOrder] = useState(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [roomServiceId, setRoomServiceId] = useState(null);
  const [localCreationTime, setLocalCreationTime] = useState(null);

  // Reset when room changes
  useEffect(() => {
    setRoomServiceId(null);
    setLocalCreationTime(null);
  }, [selectedRoom]);

  // Fetch orders effect
  useEffect(() => {
    const fetchOrdersForTable = async () => {
      if (!selectedRoom) {
        setRemoteOrder(null);
        setOrderId(null);
        return;
      }
      setIsLoadingRemote(true);
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
          setRemoteOrder(chosen || null);
          const chosenOrderId = chosen?._id || null;
          setOrderId(chosenOrderId);
          
          if (chosenOrderId && selectedRoom) {
            dispatch(
              setOrderIdForRoom({ room: selectedRoom, orderId: chosenOrderId })
            );
          }
          
          if (chosen?.orderItems?.length) {
            // Group duplicate items
            const grouped = new Map();
            chosen.orderItems.forEach((it) => {
              const key = it?.stockId?._id || it?.stockId;
              const name = it.stockName || it?.stockId?.name;
              const price = it.price || 0;
              const qty = it.quantity || 1;
              if (!key) return;
              if (!grouped.has(key)) {
                grouped.set(key, { name, price, quantity: qty, stockId: key });
              } else {
                const existing = grouped.get(key);
                existing.quantity += qty;
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
      } catch (error) {
        console.error("Error fetching orders:", error);
        setRemoteOrder(null);
        setOrderId(null);
      } finally {
        setIsLoadingRemote(false);
      }
    };
    fetchOrdersForTable();
  }, [selectedRoom, dispatch]);

  return {
    orderId,
    setOrderId,
    remoteOrder,
    setRemoteOrder,
    isLoadingRemote,
    roomServiceId,
    setRoomServiceId,
    localCreationTime,
    setLocalCreationTime,
  };
};

