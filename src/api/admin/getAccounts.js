import axios from "../axios";

const getAccounts = async () => {
  try {
    const res = await axios.get("api/v1/admin");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getAccounts;

