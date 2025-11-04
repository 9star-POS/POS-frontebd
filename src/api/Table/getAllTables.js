import axios from "../axios";

const getAllTables = async () => {
  try {
    const res = await axios.get("api/v1/table-service");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getAllTables;

