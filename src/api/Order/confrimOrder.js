import { toast } from "sonner";
import axios from "../axios";

// Generate code
const confirmOrder = async (data) => {
  const toastId = toast.loading("Pls Wait...");
  try {
    const res = await axios.post(`api/v1/orders`, data);
    toast.success("Order Confirmed Successfully", {
      id: toastId,
      autoClose: 500,
    });
    return res.data;
  } catch (error) {
    toast.error(error.response.data.message, {
      id: toastId,
      autoClose: 500,
    });
    return error;
  }
};

export default confirmOrder;
