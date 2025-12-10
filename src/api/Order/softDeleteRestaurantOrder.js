import { toast } from "sonner";
import axios from "../axios";

const softDeleteRestaurantOrder = async (orderId) => {
  const toastId = toast.loading("Deleting Order...");
  try {
    const res = await axios.patch(
      `api/v1/restaurant-order/soft-delete/${orderId}`
    );
    toast.success(res?.data?.message || "Order deleted successfully!", {
      id: toastId,
      autoClose: 2000,
    });
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.message ||
        "There was an error deleting the order!",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default softDeleteRestaurantOrder;

