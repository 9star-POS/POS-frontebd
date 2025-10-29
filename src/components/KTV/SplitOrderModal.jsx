import React, { useEffect, useMemo, useState } from "react";
import { XCircle, Plus, Minus } from "lucide-react";

function SplitOrderModal({ isOpen, onClose, items = [], currency = "MMK" }) {
  const [selection, setSelection] = useState({});

  useEffect(() => {
    if (isOpen) {
      const initial = {};
      items.forEach((item, idx) => {
        initial[idx] = { selected: false, quantity: 1 };
      });
      setSelection(initial);
    }
  }, [isOpen, items]);

  const toggleSelect = (idx) => {
    setSelection((prev) => ({
      ...prev,
      [idx]: {
        selected: !prev[idx]?.selected,
        quantity: Math.max(1, prev[idx]?.quantity || 1),
      },
    }));
  };

  const incrementQty = (idx) => {
    setSelection((prev) => ({
      ...prev,
      [idx]: {
        selected: true,
        quantity: Math.max(1, (prev[idx]?.quantity || 1) + 1),
      },
    }));
  };

  const decrementQty = (idx) => {
    setSelection((prev) => ({
      ...prev,
      [idx]: {
        selected: true,
        quantity: Math.max(1, (prev[idx]?.quantity || 1) - 1),
      },
    }));
  };

  const selectedLines = useMemo(() => {
    return items
      .map((item, idx) => ({ idx, item, s: selection[idx] }))
      .filter(({ s }) => s?.selected);
  }, [items, selection]);

  const selectedTotal = useMemo(() => {
    return selectedLines.reduce((sum, { item, s }) => {
      const qty = Math.min(s?.quantity || 1, item.quantity || 1);
      return sum + Number(item.price || 0) * qty;
    }, 0);
  }, [selectedLines]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
      <div className="w-full md:max-w-xl bg-white rounded-t-2xl md:rounded-2xl p-4 md:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-semibold">Split Order</p>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle size={22} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto divide-y">
          {items.length === 0 && (
            <p className="text-gray-500 text-sm py-6 text-center">
              No items to split
            </p>
          )}
          {items.map((item, idx) => {
            const s = selection[idx] || { selected: false, quantity: 1 };
            const maxQty = Math.max(1, item.quantity || 1);
            const qty = Math.min(s.quantity, maxQty);
            return (
              <div key={idx} className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={!!s.selected}
                  onChange={() => toggleSelect(idx)}
                  className="h-4 w-4 accent-primary"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {Number(item.price || 0).toLocaleString()} {currency} · Qty{" "}
                    {item.quantity || 1}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1 rounded-md hover:bg-gray-100 text-primary"
                    onClick={() => decrementQty(idx)}
                    disabled={!s.selected}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-[28px] text-center font-medium">
                    {qty}
                  </span>
                  <button
                    className="p-1 rounded-md hover:bg-gray-100 text-primary"
                    onClick={() => incrementQty(idx)}
                    disabled={!s.selected || qty >= maxQty}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="min-w-[90px] text-right font-medium">
                  {(Number(item.price || 0) * qty).toLocaleString()} {currency}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 mt-2 border-t">
          <div className="flex justify-between items-center mb-3">
            <p className="text-gray-600">Selected Total</p>
            <p className="font-semibold text-primary">
              {selectedTotal.toLocaleString()} {currency}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white text-primary font-semibold py-3 rounded-full border border-primary hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-primary text-white font-semibold py-3 rounded-full border border-primary hover:bg-primary/90"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplitOrderModal;
