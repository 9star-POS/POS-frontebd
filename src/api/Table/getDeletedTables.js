import axios from "../axios";

const getDeletedTables = async () => {
  try {
    const res = await axios.get("api/v1/table-service/deleted");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getDeletedTables;

