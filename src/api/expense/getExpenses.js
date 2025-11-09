import axios from "../axios";

const getExpenses = async (params = {}) => {
  try {
    const res = await axios.get("api/v1/expense-tracker", { params });
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getExpenses;

