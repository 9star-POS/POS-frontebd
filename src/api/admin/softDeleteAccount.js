import axios from "../axios";

const softDeleteAccount = async (accountId) => {
  try {
    const res = await axios.patch(`api/v1/admin/soft-delete/${accountId}`);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default softDeleteAccount;

