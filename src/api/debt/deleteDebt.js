import axios from "../axios";
import { toast } from "sonner";

const deleteDebt = async (id) => {
  const toastId = toast.loading("Deleting debt...");
  try {
    const res = await axios.patch(`api/v1/debt-tracker/${id}`);
    if (res?.data?.code === 200 && res?.data?.status === "success") {
      toast.success(res?.data?.message || "Debt deleted successfully", {
        id: toastId,
        autoClose: 2000,
      });
      return res.data;
    } else {
      toast.error("Failed to delete debt", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { error: "Failed to delete debt" };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to delete debt",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default deleteDebt;

