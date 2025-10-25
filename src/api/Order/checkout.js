import { toast } from "sonner";
import axios from "../axios";

const checkoutOrder = async ({ id, data }) => {
  try {
    const res = await axios.patch(`api/v1/restaurant-order/${id}/status`, data);
    return res.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Something went wrong");
    return error;
  }
};

export default checkoutOrder;
