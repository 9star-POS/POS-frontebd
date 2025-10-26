import axios from "../axios";

const getKtvOrders = async () => {
  try {
    const res = await axios.get("api/v1/ktv");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getKtvOrders;
