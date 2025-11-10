import axios from "../axios";

const updateAccount = async ({ accountId, ...payload }) => {
  try {
    const res = await axios.patch(`api/v1/admin/${accountId}`, payload);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default updateAccount;

