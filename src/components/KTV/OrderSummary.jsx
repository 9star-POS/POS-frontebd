import React from "react";
import { useDispatch } from "react-redux";
import { setRoomNote } from "../../redux/ktvReceiptSlice";

const OrderSummary = ({
  selectedRoom,
  receipts,
  remoteOrder,
  subtotal,
  roomCharges,
  vocalistCharges,
  taxRate,
  serviceFee,
  discountAmount,
  tax,
  serviceFeeAmount,
  total,
  onTaxChange,
  onServiceFeeChange,
  onDiscountChange,
  hasLocalItems,
  roomServiceId,
  orderId,
  userRole,
  onSendKitchen,
  onRemoveItems,
  onCheckout,
  isLoadingRemoveModal,
}) => {
  const dispatch = useDispatch();

  return (
    <div className="sticky bottom-[-150px] lg:bottom-[0] pb-2 bg-white border-t pt-3">
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Subtotal</p>
          <p className="font-medium">{subtotal.toLocaleString()} MMK</p>
        </div>

        {remoteOrder && typeof remoteOrder.discount === "number" && (
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Discount</p>
            <p className="font-medium text-gray-600">
              {Number(remoteOrder.discount || 0).toLocaleString()} MMK
            </p>
          </div>
        )}

        {roomCharges > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Room Charges</p>
              <p className="font-medium text-gray-600">
                {roomCharges.toLocaleString()} MMK
              </p>
            </div>
            <input
              type="text"
              placeholder="Add note..."
              value={receipts[selectedRoom]?.note || ""}
              onChange={(e) =>
                dispatch(
                  setRoomNote({
                    room: selectedRoom,
                    note: e.target.value,
                  })
                )
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {vocalistCharges > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Vocalist Charges</p>
            <p className="font-medium text-gray-600">
              {vocalistCharges.toLocaleString()} MMK
            </p>
          </div>
        )}

        <div className="flex justify-between items-center border-t pt-3">
          <div className="flex items-center gap-2">
            <p className="text-gray-600">Gov Tax</p>
            <div className="relative">
              <input
                type="text"
                value={taxRate === 0 ? "0" : taxRate}
                onChange={onTaxChange}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:border-primary"
                min="0"
                max="100"
              />
              <span className="absolute right-[-22px] top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
          </div>
          <p className="font-medium text-gray-600">{tax.toLocaleString()} MMK</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="text-gray-600">Service Fee</p>
            <div className="relative">
              <input
                type="text"
                value={serviceFee === 0 ? "" : serviceFee}
                onChange={onServiceFeeChange}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:border-primary"
                min="0"
                max="100"
              />
              <span className="absolute right-[-22px] top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
          </div>
          <p className="font-medium text-gray-600">
            {serviceFeeAmount.toLocaleString()} MMK
          </p>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-gray-600">Discount</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={discountAmount === 0 ? "" : discountAmount}
              onChange={onDiscountChange}
              className="w-28 px-3 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:border-primary font-medium"
              placeholder="0"
            />
            <span className="text-gray-600 text-sm">MMK</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <p className="font-bold text-lg">Total</p>
          <p className="font-bold text-lg text-primary">
            {total.toLocaleString()} MMK
          </p>
        </div>
      </div>

      {(hasLocalItems || roomServiceId || orderId) && (
        <div className="flex flex-col gap-3">
          <div
            className={`flex gap-3 ${
              userRole === "ktv-waiter" ? "flex-col" : "flex-row"
            }`}
          >
            <button
              onClick={onSendKitchen}
              className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
            >
              Send for Preparation
            </button>
            {orderId && (
              <button
                onClick={onRemoveItems}
                disabled={isLoadingRemoveModal}
                className={`flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary transition-colors ${
                  isLoadingRemoveModal
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                {isLoadingRemoveModal ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </span>
                ) : (
                  "Remove Items"
                )}
              </button>
            )}
          </div>
          {orderId && userRole !== "ktv-waiter" && (
            <button
              onClick={onCheckout}
              className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
            >
              Checkout
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderSummary;

