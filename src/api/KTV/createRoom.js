import axios from "../axios";

const createRoom = async (data) => {
  try {
    const res = await axios.post("api/v1/roomService", data);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default createRoom;
