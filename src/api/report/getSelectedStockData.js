import axios from "../axios";

/**
 * Get selected stock data with remaining quantities
 * @returns {Promise} - API response with stock data containing quantities
 */
const getSelectedStockData = async () => {
  try {
    const res = await axios.get("api/v1/stock/selected-data");
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getSelectedStockData;
