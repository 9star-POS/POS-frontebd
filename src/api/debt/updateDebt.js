import { toast } from "sonner";
import axios from "../axios";

const updateDebt = async (debtId, data) => {
  const toastId = toast.loading("Updating debt...");
  try {
    const res = await axios.put(`api/v1/debt-tracker/${debtId}`, data);
    if (res?.data?.success) {
      toast.success(res?.data?.message || "Debt updated successfully", {
        id: toastId,
        autoClose: 2000,
      });
      return res.data;
    } else {
      toast.error(res?.data?.message || "Failed to update debt", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { error: "Failed to update debt" };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to update debt",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default updateDebt;

