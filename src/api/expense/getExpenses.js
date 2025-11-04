import axios from "../axios";

const getExpenses = async () => {
  try {
    const res = await axios.get("api/v1/expense-tracker");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getExpenses;

