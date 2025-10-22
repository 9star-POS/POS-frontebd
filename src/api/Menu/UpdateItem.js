import { toast } from "sonner";
import axios from "../axios";

// Generate code
const updateMenu = async (data) => {
  const toastId = toast.loading("Editing Menu...");
  try {
    const res = await axios.patch(
      `api/v1/menu/items/${data.id}`,
      data.formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    toast.success("Menu Edit Successfully", {
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

export default updateMenu;
