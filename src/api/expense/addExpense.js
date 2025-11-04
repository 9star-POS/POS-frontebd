import axios from "../axios";

const addExpense = async (data) => {
  try {
    const res = await axios.post("api/v1/expense-tracker", data);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default addExpense;

