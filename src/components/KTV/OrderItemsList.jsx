import React from "react";
import { Plus, Minus } from "lucide-react";

const OrderItemsList = ({
  items,
  getLocalQuantity,
  onIncrement,
  onDecrement,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <>
      {items.map((item, index) => {
        const localQty = getLocalQuantity(item);
        const hasLocalQuantity = localQty > 0;

        return (
          <div
            key={index}
            className="flex justify-between items-center bg-white py-3 rounded-lg shadow-sm"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                {item.price.toLocaleString()} MMK
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {hasLocalQuantity && (
                  <button
                    onClick={() => onDecrement(item.name)}
                    className="p-1 rounded-md hover:bg-gray-100 text-primary"
                  >
                    <Minus size={16} />
                  </button>
                )}
                <span className="font-medium min-w-[24px] text-center">
                  {item.quantity || 1}
                </span>
                <button
                  onClick={() => onIncrement(item.name)}
                  className="p-1 rounded-md hover:bg-gray-100 text-primary"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="font-medium min-w-[100px] text-right">
                {(item.price * (item.quantity || 1)).toLocaleString()} MMK
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default OrderItemsList;

