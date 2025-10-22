import axios from "../axios";

// Generate code
const getReport = async (data) => {
  console.log(data.startDate);
  try {
    const res = await axios.get(
      `api/v1/orders/revenue-report/pdf?startDate=${data.startDate}&endDate=${data.endDate}`
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getReport;
