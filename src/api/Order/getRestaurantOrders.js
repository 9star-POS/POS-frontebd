import axios from "../axios";

const getRestaurantOrders = async (params = {}) => {
  try {
    const res = await axios.get("api/v1/restaurant-order", {
      params,
    });
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getRestaurantOrders;
