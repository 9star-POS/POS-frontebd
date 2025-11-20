import axios from "../axios";

const getDebts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.append("endDate", filters.endDate);
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `api/v1/debt-tracker?${queryString}`
      : "api/v1/debt-tracker";
    
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getDebts;

