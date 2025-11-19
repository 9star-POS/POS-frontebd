import { toast } from "sonner";
import axios from "../axios";

const removeKtvOrderItems = async (orderId, orderItems) => {
  const toastId = toast.loading("Removing order items...");
  try {
    // Ensure all quantities are positive numbers
    const sanitizedOrderItems = orderItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
    }));

    const res = await axios.delete(
      `api/v1/ktv/${orderId}/order-items`,
      {
        data: {
          orderItems: sanitizedOrderItems,
        },
      }
    );
    if (res?.data?.code === 200 && res?.data?.status === "success") {
      toast.success(res?.data?.message || "Order items removed successfully", {
        id: toastId,
        autoClose: 2000,
      });
      return res.data;
    } else {
      toast.error("Failed to remove order items", {
        id: toastId,
        autoClose: 2000,
      });
      return res?.data || { error: "Failed to remove order items" };
    }
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to remove order items",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default removeKtvOrderItems;

