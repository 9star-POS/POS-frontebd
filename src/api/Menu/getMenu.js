import axios from "../axios";

// Generate code
const getMenu = async () => {
  try {
    const res = await axios.get("api/v1/categories");
    return res.data;
  } catch (error) {
    return error;
  }
};

export default getMenu;
