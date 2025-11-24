import axios from "../axios";

const updateRoom = async (roomId, data) => {
  try {
    const res = await axios.patch(`api/v1/room-service/${roomId}`, data);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default updateRoom;

