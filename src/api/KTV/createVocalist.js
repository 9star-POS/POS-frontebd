import axios from "../axios";

const createVocalist = async (data) => {
  try {
    const res = await axios.post("api/v1/vocalist", data);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default createVocalist;
