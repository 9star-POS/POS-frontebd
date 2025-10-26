import axios from "../axios";

const addVocalistToOrder = async ({ orderId, vocalists }) => {
  console.log(orderId, vocalists);
  try {
    const res = await axios.post(`api/v1/ktv/${orderId}/vocalist`, {
      vocalist: vocalists,
    });
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};

export default addVocalistToOrder;
