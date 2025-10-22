import { toast } from "sonner";
import axios from "../axios";

// Generate code
const Deleteitems = async (id) => {
  const toastId = toast.loading("Deleting Item...");
  try {
    const res = await axios.patch(`api/v1/stock/${id}`);
    toast.success("Deleted Item", {
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

export default Deleteitems;
