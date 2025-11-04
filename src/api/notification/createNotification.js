import axios from "../axios";

const createNotification = async (notificationData) => {
  try {
    const res = await axios.post("api/v1/notification", notificationData);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default createNotification;

