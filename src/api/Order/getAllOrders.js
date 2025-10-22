import axios from "../axios";

// Generate code
const getAllOrders = async (data) => {
  // console.log(data.startDate);
  try {
    const res = await axios.get(
      `api/v1/orders/range?startDate=${data.startDate}&endDate=${data.endDate}`
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getAllOrders;
