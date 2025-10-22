import { toast } from "sonner";
import axios from "../axios";

// Generate code
const addMenu = async (data) => {
  const toastId = toast.loading("Adding New Menu...");
  try {
    const res = await axios.post(`api/v1/menu/add-item`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    toast.success("Menu Added Successfully", {
      id: toastId,
      autoClose: 500,
    });
    return res.data;
  } catch (error) {
    toast.error(error.response.data.message, {
      id: toastId,
      autoClose: 500,
    });
    return error;
  }
};

export default addMenu;
