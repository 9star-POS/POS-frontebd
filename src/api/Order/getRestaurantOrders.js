import axios from "../axios";

const getRestaurantOrders = async () => {
  try {
    const res = await axios.get("api/v1/restaurant-order");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getRestaurantOrders;
