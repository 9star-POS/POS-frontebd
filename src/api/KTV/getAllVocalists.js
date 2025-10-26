import axios from "../axios";

const getAllVocalists = async () => {
  try {
    const res = await axios.get("api/v1/vocalist");
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default getAllVocalists;
