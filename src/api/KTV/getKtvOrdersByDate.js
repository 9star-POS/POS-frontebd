import axios from "../axios";

const getKtvOrdersByDate = async (data) => {
  try {
    const res = await axios.get(
      `api/v1/ktv/range?startDate=${data.startDate}&endDate=${data.endDate}`
    );
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getKtvOrdersByDate;
