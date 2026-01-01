import { toast } from "sonner";
import axios from "../axios";

const changeKtvOrderRoom = async (orderId, roomServiceId) => {
  try {
    const res = await axios.patch(`api/v1/ktv/${orderId}/room`, {
      roomServiceId,
    });
    return res.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Something went wrong");
    return error?.response?.data || error;
  }
};

export default changeKtvOrderRoom;

