import axios from "../axios";

const updateKitchenItemStatus = async (
  orderId,
  orderType,
  orderItemId,
  status
) => {
  try {
    const res = await axios.patch(`api/v1/kitchen/status`, {
      orderId: orderId,
      orderType: orderType,
      orderItemUpdates: [
        {
          orderItemId: orderItemId,
          kitchenStatus: status,
        },
      ],
    });
    return res.data;
  } catch (error) {
    console.error("Error updating kitchen item status:", error);
    throw error;
  }
};

export default updateKitchenItemStatus;
