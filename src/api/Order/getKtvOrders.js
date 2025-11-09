import axios from "../axios";

const getKtvOrders = async (params = {}) => {
  try {
    const res = await axios.get("api/v1/ktv", {
      params,
    });
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getKtvOrders;
