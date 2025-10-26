import axios from "../axios";

const finalizeKtvOrder = async (orderId, data) => {
  try {
    const res = await axios.patch(`api/v1/ktv/${orderId}/status`, data);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default finalizeKtvOrder;
