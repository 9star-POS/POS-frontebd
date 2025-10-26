import axios from "../axios";

const getRestaurantOrderById = async (id) => {
  try {
    const res = await axios.get(`api/v1/restaurant-order/${id}`);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getRestaurantOrderById;
