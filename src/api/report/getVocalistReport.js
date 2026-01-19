import axios from "../axios";

/**
 * Get vocalist report data for a specific date range
 * @param {Object} data - Contains startDate and endDate
 * @returns {Promise} - API response with vocalist report data
 */
const getVocalistReport = async (data) => {
  try {
    const res = await axios.get(
      `api/v1/vocalist-report?startDate=${data.startDate}&endDate=${data.endDate}`
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getVocalistReport;
