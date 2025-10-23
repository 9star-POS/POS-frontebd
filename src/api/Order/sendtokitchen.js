import { toast } from "sonner";
import axios from "../axios";

// Generate code
const sendToKitchen = async (data) => {
  try {
    const res = await axios.post(`api/v1/restaurant-order`, data);
    return res.data;
  } catch (error) {
    toast.error(error.response.data?.message || "Something went wrong");
    return error;
  }
};

export default sendToKitchen;
