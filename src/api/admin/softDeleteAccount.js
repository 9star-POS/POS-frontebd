import axios from "../axios";

const softDeleteAccount = async (accountId) => {
  try {
    const res = await axios.delete(`api/v1/admin/${accountId}`);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default softDeleteAccount;
