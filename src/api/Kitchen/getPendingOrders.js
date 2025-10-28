import axios from "../axios";

const getPendingOrders = async () => {
  try {
    const response = await axios.get("/api/v1/kitchen/pending");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending kitchen orders:", error);
    throw error;
  }
};

export default getPendingOrders;
