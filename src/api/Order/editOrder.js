import { toast } from "sonner";
import axios from "../axios";

// Generate code
const editOrderData = async (data) => {
  // console.log("data", data);
  const toastId = toast.loading("Pls Wait...");
  try {
    const res = await axios.put(`api/v1/orders/${data.id}`, data.orderData);
    toast.success("Order Update Successfully", {
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

export default editOrderData;
