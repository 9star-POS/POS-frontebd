import axios from "../axios";

const getTableService = async (tableNumber) => {
  try {
    const res = await axios.get(`api/v1/table-service`);
    const payload = res?.data;

    if (payload?.success && Array.isArray(payload.data)) {
      const table = payload.data.find(
        (t) => String(t.tableNumber) === String(tableNumber)
      );
      if (table) {
        return { success: true, data: table };
      }
      return { success: false, message: "Table not found" };
    }

    // Handle case where response is directly an array
    if (Array.isArray(payload)) {
      const table = payload.find(
        (t) => String(t.tableNumber) === String(tableNumber)
      );
      if (table) {
        return { success: true, data: table };
      }
      return { success: false, message: "Table not found" };
    }

    return payload;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getTableService;

