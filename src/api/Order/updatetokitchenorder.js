import { toast } from "sonner";
import axios from "../axios";

// Generate code
const updateKitchenOrder = async ({ data, id }) => {
  try {
    const res = await axios.post(`api/v1/restaurant-order/${id}`, data);
    return res.data;
  } catch (error) {
    toast.error(error.response.data?.message || "Something went wrong");
    return error;
  }
};

export default updateKitchenOrder;
