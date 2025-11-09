import axios from "../axios";

const createAccount = async (payload) => {
  try {
    const res = await axios.post("api/v1/admin/signup", payload);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default createAccount;

