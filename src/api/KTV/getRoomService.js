import axios from "../axios";

const getRoomService = async (roomNumber) => {
  try {
    const res = await axios.get(`api/v1/room-service`);
    const payload = res?.data;
    if (payload?.success && Array.isArray(payload.data)) {
      // Find the specific room
      const room = payload.data.find(
        (r) => String(r.roomNumber) === String(roomNumber)
      );
      if (room) {
        return { success: true, data: room };
      }
      return { success: false, message: "Room not found" };
    }
    return payload;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getRoomService;
