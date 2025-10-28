import { toast } from "sonner";
import axios from "../axios";

const updateKtvOrder = async ({ data, id }) => {
  try {
    const res = await axios.post(`api/v1/ktv/${id}/order-items`, data);
    return res.data;
  } catch (error) {
    toast.error(error.response.data?.message || "Something went wrong");
    return error;
  }
};

export default updateKtvOrder;
