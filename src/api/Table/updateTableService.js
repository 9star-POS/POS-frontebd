import axios from "../axios";
import { toast } from "sonner";

const updateTableService = async (tableServiceId, payload) => {
  const toastId = toast.loading("Updating table...");
  try {
    const res = await axios.patch(
      `api/v1/table-service/${tableServiceId}`,
      payload
    );
    if (res?.data?.success) {
      toast.success(
        res?.data?.message || "Table service updated successfully",
        {
          id: toastId,
          autoClose: 2000,
        }
      );
      return res.data;
    } else {
      toast.error(res?.data?.message || "Failed to update table", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { success: false };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to update table",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default updateTableService;

