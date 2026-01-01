import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setRoomServiceForRoom } from "../../../redux/ktvReceiptSlice";
import getRoomService from "../../../api/KTV/getRoomService";

export const useKtvRoomService = (selectedRoom, orderId, roomServiceId, setRoomServiceId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchRoomService = async () => {
      if (!selectedRoom || orderId || roomServiceId) return;
      const res = await getRoomService(selectedRoom);
      if (res?.success && res?.data?._id) {
        setRoomServiceId(res.data._id);
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
  }, [selectedRoom, orderId, roomServiceId, dispatch, setRoomServiceId]);
};

