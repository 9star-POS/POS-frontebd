import { toast } from "sonner";
import axios from "../axios";

// Generate code
const confirmPayment = async (data) => {
  try {
    const res = await axios.put(`api/v1/order/payment/${data.id}`, data.data);
    return res.data;
  } catch (error) {
    toast.error(error.response.data.message, {
      autoClose: 500,
    });
    return error;
  }
};

export default confirmPayment;
