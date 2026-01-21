import { toast } from "sonner";
import axios from "../axios";

const changeRestaurantOrderTable = async (orderId, tableId) => {
  try {
    const res = await axios.patch(`api/v1/restaurant-order/${orderId}/table`, {
      tableId,
    });
    return res.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Something went wrong");
    return error?.response?.data || error;
  }
};

export default changeRestaurantOrderTable;
