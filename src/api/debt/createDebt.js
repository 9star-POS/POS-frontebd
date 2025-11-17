import axios from "../axios";
import { toast } from "sonner";

const createDebt = async (data) => {
  const toastId = toast.loading("Adding debt...");
  try {
    const res = await axios.post("api/v1/debt-tracker", data);
    if (res?.data?.code === 201 && res?.data?.status === "success") {
      toast.success(res?.data?.message || "Debt tracker added successfully", {
        id: toastId,
        autoClose: 2000,
      });
      return res.data;
    } else {
      toast.error("Failed to add debt", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { error: "Failed to add debt" };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to add debt",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default createDebt;

