import axios from "../axios";

const getRoomService = async (roomNumber) => {
  try {
    const res = await axios.get(`api/v1/room-service`);
    if (res?.data?.code === 200 && Array.isArray(res.data.data)) {
      // Find the specific room
      const room = res.data.data.find(
        (r) => String(r.roomNumber) === String(roomNumber)
      );
      if (room) {
        return { code: 200, status: "success", data: room };
      }
      return { code: 404, status: "error", message: "Room not found" };
    }
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getRoomService;
