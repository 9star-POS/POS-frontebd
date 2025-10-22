import axios from "../axios";

// Generate code
const getAOrders = async (id) => {
  try {
    const res = await axios.get(`api/v1/orders/${id}`);
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getAOrders;
