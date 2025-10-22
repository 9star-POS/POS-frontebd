import { toast } from "sonner";
import axios from "../axios";

// Generate code
const confirmOrder = async (data) => {
  try {
    const res = await axios.post(`api/v1/orders`, data);
    return res.data;
  } catch (error) {
    toast.error(error.response.data?.message || "Something went wrong");
    return error;
  }
};

export default confirmOrder;
