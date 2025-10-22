import axios from "../axios";

// Generate code
const getItems = async () => {
  try {
    const res = await axios.get("api/v1/menu");
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getItems;
