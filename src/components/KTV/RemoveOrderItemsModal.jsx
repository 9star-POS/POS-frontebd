import React from "react";
import { X, Plus, Minus } from "lucide-react";

const RemoveOrderItemsModal = ({
  isOpen,
  onClose,
  orderItemsForRemove,
  onDecrement,
  onIncrement,
  onSave,
  isUpdatingOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold">Remove Items from Order</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isUpdatingOrder}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {orderItemsForRemove.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in order
            </div>
          ) : (
            <div className="space-y-4">
              {orderItemsForRemove.map((item, index) => (
                <div
                  key={`${item.stockId}-${index}`}
                  className="flex justify-between items-center py-3 px-4 rounded-lg bg-gray-50"
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
                        onClick={() => onDecrement(index)}
                        className="p-1 rounded-md hover:bg-gray-200 text-primary"
                        disabled={item.quantity <= 0 || isUpdatingOrder}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-medium min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onIncrement(index)}
                        className="p-1 rounded-md hover:bg-gray-200 text-primary"
                        disabled={
                          isUpdatingOrder ||
                          item.quantity >= item.originalQuantity
                        }
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
              disabled={isUpdatingOrder}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isUpdatingOrder || orderItemsForRemove.length === 0}
              className={`flex-1 px-4 py-2 rounded-lg text-white ${
                isUpdatingOrder || orderItemsForRemove.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isUpdatingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveOrderItemsModal;

