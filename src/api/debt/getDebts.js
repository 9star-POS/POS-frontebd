import axios from "../axios";

const getDebts = async () => {
  try {
    const res = await axios.get("api/v1/debt-tracker");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getDebts;

