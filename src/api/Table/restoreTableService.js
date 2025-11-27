import axios from "../axios";
import { toast } from "sonner";

const restoreTableService = async (tableServiceId) => {
  const toastId = toast.loading("Restoring table...");
  try {
    const res = await axios.patch(
      `api/v1/table-service/restore/${tableServiceId}/restore`
    );
    if (res?.data?.success) {
      toast.success(
        res?.data?.message || "Table restored successfully",
        {
          id: toastId,
          autoClose: 2000,
        }
      );
      return res.data;
    } else {
      toast.error(res?.data?.message || "Failed to restore table", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { success: false };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to restore table",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default restoreTableService;

