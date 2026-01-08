import axios from "../axios";

const deleteRoom = async (roomId) => {
  try {
    const res = await axios.delete(`api/v1/room-service/${roomId}`);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default deleteRoom;

