import axios from "../axios";

const updateRoomStatus = async (roomId, status) => {
  try {
    const res = await axios.patch(`api/v1/room-service/${roomId}/status`, {
      status,
    });
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default updateRoomStatus;

