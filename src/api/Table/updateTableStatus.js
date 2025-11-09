import axios from "../axios";

const updateTableStatus = async ({ tableServiceId, status }) => {
  try {
    const res = await axios.patch(
      `api/v1/table-service/${tableServiceId}`,
      {
        status,
      }
    );
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default updateTableStatus;

