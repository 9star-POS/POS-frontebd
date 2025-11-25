import axios from "../axios";

const updatePassword = async (accountId, data) => {
  try {
    const res = await axios.patch(`api/v1/admin/update-password/${accountId}`, data);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default updatePassword;

