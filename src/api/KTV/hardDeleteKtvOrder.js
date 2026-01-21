import { toast } from "sonner";
import axios from "../axios";

const hardDeleteKtvOrder = async (orderId) => {
  try {
    const res = await axios.delete(`api/v1/ktv/${orderId}`);
    return res.data;
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to permanently delete KTV order",
    );
    return error?.response?.data || error;
  }
};

export default hardDeleteKtvOrder;
