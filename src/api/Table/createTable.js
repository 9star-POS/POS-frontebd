import axios from "../axios";
import { toast } from "sonner";

const createTable = async (payload) => {
  const toastId = toast.loading("Creating table...");
  try {
    const res = await axios.post("api/v1/table-service", payload);
    toast.success("Table created successfully", { id: toastId });
    return res.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create table";
    toast.error(message, { id: toastId });
    return {
      code: error?.response?.status,
      status: "error",
      message,
      data: error?.response?.data,
    };
  }
};

export default createTable;

