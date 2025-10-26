import axios from "../axios";

const sendKtvOrder = async (data) => {
  try {
    const res = await axios.post("api/v1/ktv", data);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default sendKtvOrder;
