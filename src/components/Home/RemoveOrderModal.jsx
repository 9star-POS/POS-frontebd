import { useState, useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";
import getRestaurantOrderById from "../../api/Order/getRestaurantOrderById";
import removeOrderItems from "../../api/Order/removeOrderItems";
import { toast } from "sonner";
import Loading from "../Loading";

const RemoveOrderModal = ({ isOpen, onClose, orderId, onOrderUpdated }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
    } else {
      setOrder(null);
      setItems([]);
    }
  }, [isOpen, orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await getRestaurantOrderById(orderId);
      if (res?.success) {
        setOrder(res.data);
        // Group items by stockId and combine quantities
        const grouped = new Map();
        (res.data?.orderItems || []).forEach((it) => {
          const stockId = it?.stockId?._id || it?.stockId;
          const stockName = it.stockName || it?.stockId?.name || "";
          const price = it.price || 0;
          const qty = it.quantity || 1;
          const orderItemId = it._id;

          if (!stockId) return;

          if (!grouped.has(stockId)) {
            grouped.set(stockId, {
              stockId: stockId,
              stockName: stockName,
              price: price,
              quantity: qty,
              originalQuantity: qty,
              orderItemIds: [{ orderItemId, quantity: qty }], // Track individual order items
            });
          } else {
            const existing = grouped.get(stockId);
            existing.quantity += qty;
            existing.originalQuantity += qty;
            existing.orderItemIds.push({ orderItemId, quantity: qty });
          }
        });
        setItems(Array.from(grouped.values()));
      } else {
        toast.error("Failed to fetch order");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = (index) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      if (updated[index].quantity > 1) {
        updated[index].quantity -= 1;
      } else {
        // Remove item if quantity reaches 0
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const handleIncrement = (index) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      // Don't allow incrementing beyond original quantity
      if (updated[index].quantity < updated[index].originalQuantity) {
        updated[index].quantity += 1;
      }
      return updated;
    });
  };

  const handleRemoveItems = async () => {
    if (!orderId) return;

    setUpdating(true);
    try {
      // Build array of items to remove with orderItemId and quantity
      const itemsToRemove = [];

      items.forEach((item) => {
        const quantityToRemove = item.originalQuantity - item.quantity;
        if (quantityToRemove > 0) {
          // Distribute removal across orderItemIds
          let remainingToRemove = quantityToRemove;
          let orderItemIndex = 0;

          while (remainingToRemove > 0 && orderItemIndex < item.orderItemIds.length) {
            const orderItem = item.orderItemIds[orderItemIndex];
            const removeFromThisItem = Math.min(remainingToRemove, orderItem.quantity);
            
            // Add entries for each quantity to remove from this orderItem
            for (let i = 0; i < removeFromThisItem; i++) {
              itemsToRemove.push({
                orderItemId: orderItem.orderItemId,
                quantity: 1,
              });
            }
            
            remainingToRemove -= removeFromThisItem;
            orderItemIndex++;
          }
        }
      });

      if (itemsToRemove.length === 0) {
        toast.info("No items to remove");
        setUpdating(false);
        return;
      }

      const res = await removeOrderItems(orderId, itemsToRemove);

      if (res?.success) {
        toast.success(res?.message || "Order items removed successfully");
        if (onOrderUpdated) {
          onOrderUpdated(res?.data);
        }
        onClose();
      } else {
        toast.error("Failed to remove order items");
      }
    } catch (error) {
      console.error("Error removing order items:", error);
      toast.error("Failed to remove order items");
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold">Remove Order Items</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={updating}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loading />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No items in this order
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.stockId}-${index}`}
                  className="flex justify-between items-center bg-gray-50 py-3 px-4 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.stockName}</p>
                    <p className="text-sm text-gray-500">
                      {item.price.toLocaleString()} MMK
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrement(index)}
                        disabled={item.quantity <= 0 || updating}
                        className={`p-1 rounded-md hover:bg-gray-200 text-primary ${
                          item.quantity <= 0 || updating
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-medium min-w-[24px] text-center">
                        {item.quantity} / {item.originalQuantity}
                      </span>
                      <button
                        onClick={() => handleIncrement(index)}
                        disabled={
                          updating || item.quantity >= item.originalQuantity
                        }
                        className={`p-1 rounded-md hover:bg-gray-200 text-primary ${
                          updating || item.quantity >= item.originalQuantity
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-medium min-w-[100px] text-right">
                      {(item.price * item.quantity).toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-5">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveItems}
              disabled={updating || loading || items.length === 0}
              className={`flex-1 px-4 py-2 rounded-lg text-white ${
                updating || loading || items.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {updating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Removing...
                </span>
              ) : (
                "Remove Items"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveOrderModal;
