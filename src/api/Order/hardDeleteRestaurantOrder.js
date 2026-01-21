import { toast } from "sonner";
import axios from "../axios";

const hardDeleteRestaurantOrder = async (orderId) => {
  try {
    const res = await axios.delete(`api/v1/restaurant-order/${orderId}`);
    return res.data;
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to permanently delete order",
    );
    return error?.response?.data || error;
  }
};

export default hardDeleteRestaurantOrder;
