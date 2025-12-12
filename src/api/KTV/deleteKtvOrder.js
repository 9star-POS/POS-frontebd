import { toast } from "sonner";
import axios from "../axios";

const deleteKtvOrder = async (orderId) => {
  const toastId = toast.loading("Deleting KTV Order...");
  try {
    const res = await axios.patch(`api/v1/ktv/soft-delete/${orderId}`);
    toast.success(res?.data?.message || "KTV Order deleted successfully!", {
      id: toastId,
      autoClose: 2000,
    });
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.message ||
        "There was an error deleting the KTV order!",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default deleteKtvOrder;
