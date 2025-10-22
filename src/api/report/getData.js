import axios from "../axios";

// Generate code
const getData = async (data) => {
  //   console.log(data.startDate);
  try {
    const res = await axios.get(
      `api/v1/orders/revenue-report?startDate=2024-11-04&endDate=2024-12-21`
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getData;
