import { toast } from "sonner";
import axios from "../axios";

const deleteVocalist = async (vocalistId) => {
  const toastId = toast.loading("Deleting Vocalist...");
  try {
    const res = await axios.delete(`api/v1/vocalist/${vocalistId}`);
    toast.success(res?.data?.message || "Vocalist deleted successfully!", {
      id: toastId,
      autoClose: 2000,
    });
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.message ||
        "There was an error deleting the vocalist!",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default deleteVocalist;

