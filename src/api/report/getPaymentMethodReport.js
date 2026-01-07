import axios from "../axios";

/**
 * Get sales report by payment method for a specific date range
 * @param {Object} data - Contains startDate and endDate
 * @returns {Promise} - API response with payment method report data
 */
const getPaymentMethodReport = async (data) => {
  try {
    const res = await axios.get(
      `api/v1/sale-report/payment-method?startDate=${data.startDate}&endDate=${data.endDate}`
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getPaymentMethodReport;

