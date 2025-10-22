import { toast } from "sonner";
import axios from "../axios";

// Generate code
const addCategories = async (data) => {
  const toastId = toast.loading("Adding New Category list...");
  try {
    const res = await axios.post(`api/v1/categories/list`, {
      categories: [data.categoryName],
    });
    toast.success("Category Added Successfully", {
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

export default addCategories;
