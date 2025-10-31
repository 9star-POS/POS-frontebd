import axios from "../axios";

const getAllRooms = async () => {
  try {
    const res = await axios.get("api/v1/room-service");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getAllRooms;
