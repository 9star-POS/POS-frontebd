import axios from "../axios";

const getKtvOrderById = async (id) => {
  try {
    const res = await axios.get(`api/v1/ktv/${id}`);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getKtvOrderById;
