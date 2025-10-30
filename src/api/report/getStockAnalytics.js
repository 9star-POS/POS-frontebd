import axios from "../axios";

/**
 * Get stock analytics data for a specific date range
 * @param {Object} data - Contains startDate and endDate
 * @returns {Promise} - API response with stock analytics data
 */
const getStockAnalytics = async (data) => {
  try {
    const res = await axios.get(
      `api/v1/stock-analytics?startDate=${data.startDate}&endDate=${data.endDate}`
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getStockAnalytics;