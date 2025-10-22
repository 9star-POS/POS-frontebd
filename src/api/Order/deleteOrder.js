import { toast } from "sonner";
import axios from "../axios";

// Generate code
const deleteOrders = async (id) => {
  console.log("id", id);
  const toastId = toast.loading("Deleting Order...");
  try {
    const res = await axios.delete("api/v1/orders", {
      data: {
        ids: id,
      },
    });
    toast.success("Order deleted successfully!", {
      id: toastId,
      autoClose: 500, // Auto-close the toast after 5 seconds
    });
    return res.data;
  } catch (error) {
    toast.error(`There was an error deleting the order!`, {
      id: toastId,
      autoClose: 500, // Auto-close the toast after 5 seconds
    });
    return error;
  }
};

export default deleteOrders;
