import React, { useState } from "react";
import { useSelector } from "react-redux";
import box from "../../assets/box.png";
import "../input.css";
import CalculatorModal from "./CalculatorModel";
import SplitOrderModal from "./SplitOrderModal";
import RoomHeader from "./RoomHeader";
import OrderItemsList from "./OrderItemsList";
import RoomServiceDisplay from "./RoomServiceDisplay";
import VocalistsDisplay from "./VocalistsDisplay";
import OrderSummary from "./OrderSummary";
import ChangeRoomModal from "./ChangeRoomModal";
import RemoveOrderItemsModal from "./RemoveOrderItemsModal";
import { getUserRole } from "../../utils/getUserRole";

// Hooks
import { useKtvOrder } from "./hooks/useKtvOrder";
import { useKtvRoomService } from "./hooks/useKtvRoomService";
import useKtvOrderCalculations from "./hooks/useKtvOrderCalculations";
import { useKtvFormHandlers } from "./hooks/useKtvFormHandlers";
import { useKtvOrderHandlers } from "./hooks/useKtvOrderHandlers";

function Receipt({ onClose }) {
  const userRole = getUserRole();
  const selectedRoom = useSelector((state) => state.ktvReceipts.selectedRoom);
  const receipts = useSelector((state) => state.ktvReceipts.receipts);
  const roomDetails = useSelector((state) => state.ktvReceipts.roomDetails);
  const selectedRoomDetails = selectedRoom
    ? roomDetails?.[selectedRoom] || null
    : null;
  const selectedRoomId = selectedRoomDetails?.roomId;
  const selectedRoomStatus = selectedRoomDetails?.status;

  // Order management hook
  const {
    orderId,
    setOrderId,
    remoteOrder,
    setRemoteOrder,
    isLoadingRemote,
    roomServiceId,
    setRoomServiceId,
    localCreationTime,
    setLocalCreationTime,
  } = useKtvOrder(selectedRoom);

  // Room service hook
  useKtvRoomService(selectedRoom, orderId, roomServiceId, setRoomServiceId);

  // Form handlers hook
  const { taxRate, serviceFee, discountAmount, handleTaxChange, handleServiceFeeChange, handleDiscountChange } =
    useKtvFormHandlers(5, 2, 0);

  // Calculations hook
  const {
    hasLocalItems,
    hasLocalVocalists,
    hasLocalRoomService,
    hasLocalData,
    getLocalQuantity,
    subtotal,
    roomCharges,
    vocalistCharges,
    tax,
    serviceFeeAmount,
    total,
  } = useKtvOrderCalculations({
    selectedRoom,
    receipts,
    remoteOrder,
    taxRate,
    serviceFee,
    discountAmount,
    orderId,
  });

  // All handlers hook
  const {
    handleRemoveItem,
    handleIncrement,
    handleDecrement,
    isRoomChangeOpen,
    availableRooms,
    isLoadingRooms,
    isChangingRoom,
    handleOpenRoomChange,
    handleChangeRoom,
    handleCloseRoomChange,
    isRemoveOrderOpen,
    orderItemsForRemove,
    isUpdatingOrder,
    isLoadingRemoveModal,
    handleOpenRemoveOrder,
    handleDecrementInModal,
    handleIncrementInModal,
    handleSaveRemoveOrder,
    handleCloseRemoveOrder,
    isCalculatorOpen,
    handlePayment,
    handleCalculatorConfirm,
    handleCloseCalculator,
    sendKitchen,
  } = useKtvOrderHandlers({
    selectedRoom,
    receipts,
    orderId,
    setOrderId,
    remoteOrder,
    setRemoteOrder,
    roomServiceId,
    setRoomServiceId,
    setLocalCreationTime,
    selectedRoomId,
    selectedRoomStatus,
    taxRate,
    serviceFee,
    discountAmount,
    subtotal,
    roomCharges,
    vocalistCharges,
    tax,
    serviceFeeAmount,
    total,
    onClose,
  });

  const [isSplitOpen, setIsSplitOpen] = useState(false);

  return (
    <div className="text-black h-screen px-3 pt-0">
      <div className="pt-2 h-full">
        <div className="flex justify-between w-full items-center mb-5">
          <p className="sub-header font-bold">Receipt</p>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              onClick={onClose}
            >
              Save
            </button>
            {hasLocalItems && (
              <button
                onClick={() => setIsSplitOpen(true)}
                className="bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                Split Order
              </button>
            )}
          </div>
        </div>

        {!selectedRoom && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No table selected</p>
          </div>
        )}

        {selectedRoom && !hasLocalData && !remoteOrder && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No items in receipt</p>
          </div>
        )}

        {selectedRoom && (hasLocalData || remoteOrder) && (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <RoomHeader
              selectedRoom={selectedRoom}
              remoteOrder={remoteOrder}
              localCreationTime={localCreationTime}
              orderType={receipts[selectedRoom]?.orderType}
              orderId={orderId}
              onChangeRoom={handleOpenRoomChange}
            />

            <div className="flex-1 overflow-y-auto mb-5 space-y-4">
              <OrderItemsList
                items={receipts[selectedRoom]?.items || []}
                getLocalQuantity={getLocalQuantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />

              <RoomServiceDisplay
                selectedRoom={selectedRoom}
                localRoomService={receipts[selectedRoom]?.roomService}
                remoteRoomService={remoteOrder?.roomService}
              />

              <VocalistsDisplay
                selectedRoom={selectedRoom}
                localVocalists={receipts[selectedRoom]?.vocalists}
                remoteVocalists={remoteOrder?.vocalist}
              />
            </div>

            <OrderSummary
              selectedRoom={selectedRoom}
              receipts={receipts}
              remoteOrder={remoteOrder}
              subtotal={subtotal}
              roomCharges={roomCharges}
              vocalistCharges={vocalistCharges}
              taxRate={taxRate}
              serviceFee={serviceFee}
              discountAmount={discountAmount}
              tax={tax}
              serviceFeeAmount={serviceFeeAmount}
              total={total}
              onTaxChange={handleTaxChange}
              onServiceFeeChange={handleServiceFeeChange}
              onDiscountChange={handleDiscountChange}
              hasLocalItems={hasLocalItems}
              roomServiceId={roomServiceId}
              orderId={orderId}
              userRole={userRole}
              onSendKitchen={sendKitchen}
              onRemoveItems={handleOpenRemoveOrder}
              onCheckout={handlePayment}
              isLoadingRemoveModal={isLoadingRemoveModal}
            />
          </div>
        )}
      </div>

      {isCalculatorOpen && (
        <CalculatorModal
          total={total}
          onClose={handleCloseCalculator}
          onConfirm={handleCalculatorConfirm}
        />
      )}

      {isSplitOpen && (
        <SplitOrderModal
          isOpen={isSplitOpen}
          onClose={() => setIsSplitOpen(false)}
          items={receipts[selectedRoom]?.items || []}
          currency="MMK"
        />
      )}

      <RemoveOrderItemsModal
        isOpen={isRemoveOrderOpen}
        onClose={handleCloseRemoveOrder}
        orderItemsForRemove={orderItemsForRemove}
        onDecrement={handleDecrementInModal}
        onIncrement={handleIncrementInModal}
        onSave={handleSaveRemoveOrder}
        isUpdatingOrder={isUpdatingOrder}
      />

      <ChangeRoomModal
        isOpen={isRoomChangeOpen}
        onClose={handleCloseRoomChange}
        availableRooms={availableRooms}
        isLoadingRooms={isLoadingRooms}
        isChangingRoom={isChangingRoom}
        onChangeRoom={handleChangeRoom}
      />
    </div>
  );
}

export default Receipt;

