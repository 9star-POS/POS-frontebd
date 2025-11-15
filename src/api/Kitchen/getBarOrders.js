import axios from "../axios";

const getBarOrders = async () => {
  try {
    const res = await axios.get("api/v1/kitchen?category=drink");
    return res.data;
  } catch (error) {
    console.error("Error fetching bar orders:", error);
    throw error;
  }
};

export default getBarOrders;

