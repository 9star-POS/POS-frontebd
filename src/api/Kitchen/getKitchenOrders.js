import axios from "../axios";

const getKitchenOrders = async () => {
  try {
    const res = await axios.get("api/v1/kitchen");
    return res.data;
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    throw error;
  }
};

export default getKitchenOrders;
