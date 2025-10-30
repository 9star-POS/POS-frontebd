import axios from "../axios";

/**
 * Get sales report data for a specific date range
 * @param {Object} data - Contains startDate and endDate
 * @returns {Promise} - API response with sales report data
 */
const getSaleReport = async (data) => {
  try {
    const res = await axios.get(
      `api/v1/sale-report?startDate=${data.startDate}&endDate=${data.endDate}`
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getSaleReport;