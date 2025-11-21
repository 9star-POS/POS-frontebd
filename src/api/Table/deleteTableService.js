import axios from "../axios";
import { toast } from "sonner";

const deleteTableService = async (tableServiceId) => {
  const toastId = toast.loading("Deleting table...");
  try {
    const res = await axios.delete(`api/v1/table-service/${tableServiceId}`);
    if (res?.data?.success) {
      toast.success(res?.data?.message || "Table deleted successfully", {
        id: toastId,
        autoClose: 2000,
      });
      return res.data;
    } else {
      toast.error(res?.data?.message || "Failed to delete table", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { success: false };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to delete table",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default deleteTableService;


