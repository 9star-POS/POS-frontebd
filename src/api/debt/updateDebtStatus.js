import axios from "../axios";
import { toast } from "sonner";

const updateDebtStatus = async (id, status) => {
  const toastId = toast.loading("Updating debt status...");
  try {
    const res = await axios.put(`api/v1/debt-tracker/${id}`, {
      status: status,
    });
    if (res?.data?.success) {
      toast.success(res?.data?.message || "Debt status updated successfully", {
        id: toastId,
        autoClose: 2000,
      });
      return res.data;
    } else {
      toast.error(res?.data?.message || "Failed to update debt status", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { error: "Failed to update debt status" };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to update debt status",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default updateDebtStatus;
