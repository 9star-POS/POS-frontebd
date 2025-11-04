import axios from "../axios";

const getTableService = async (tableNumber) => {
  try {
    const res = await axios.get(`api/v1/table-service`);
    if (res?.data?.code === 200 && Array.isArray(res.data.data)) {
      // Find the specific table
      const table = res.data.data.find(
        (t) => String(t.tableNumber) === String(tableNumber)
      );
      if (table) {
        return { code: 200, status: "success", data: table };
      }
      return { code: 404, status: "error", message: "Table not found" };
    }
    // Handle case where response is directly an array
    if (Array.isArray(res.data)) {
      const table = res.data.find(
        (t) => String(t.tableNumber) === String(tableNumber)
      );
      if (table) {
        return { code: 200, status: "success", data: table };
      }
      return { code: 404, status: "error", message: "Table not found" };
    }
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getTableService;

