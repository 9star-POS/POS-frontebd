import { toast } from "sonner";
import axios from "../axios";

const updateVocalist = async (vocalistId, data) => {
  const toastId = toast.loading("Updating Vocalist...");
  try {
    const res = await axios.put(`api/v1/vocalist/${vocalistId}`, data);
    toast.success(res?.data?.message || "Vocalist updated successfully!", {
      id: toastId,
      autoClose: 2000,
    });
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.message ||
        "There was an error updating the vocalist!",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default updateVocalist;

