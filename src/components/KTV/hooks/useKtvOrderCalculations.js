const useKtvOrderCalculations = ({
  selectedRoom,
  receipts,
  remoteOrder,
  taxRate,
  serviceFee,
  discountAmount,
  orderId,
}) => {
  const hasLocalItems =
    !!selectedRoom && !!receipts[selectedRoom]?.items?.length;
  const hasLocalVocalists =
    !!selectedRoom && !!receipts[selectedRoom]?.vocalists?.length;
  const hasLocalRoomService =
    !!selectedRoom && !!receipts[selectedRoom]?.roomService;
  const hasLocalData =
    hasLocalItems || hasLocalVocalists || hasLocalRoomService;

  // Calculate how much quantity of an item has been sent to kitchen
  const getSentQuantity = (item) => {
    if (!remoteOrder?.orderItems || !orderId) return 0;
    const stockId = item._id || item.stockId;
    if (!stockId) return 0;

    let sentQty = 0;
    remoteOrder.orderItems.forEach((remoteItem) => {
      const remoteStockId = remoteItem?.stockId?._id || remoteItem?.stockId;
      if (remoteStockId === stockId) {
        sentQty += remoteItem.quantity || 1;
      }
    });
    return sentQty;
  };

  // Calculate local (unsent) quantity for an item
  const getLocalQuantity = (item) => {
    const currentQty = item.quantity || 1;
    const sentQty = getSentQuantity(item);
    return Math.max(0, currentQty - sentQty);
  };

  const calculateSubtotal = () => {
    if (remoteOrder?.subTotal != null) return Number(remoteOrder.subTotal) || 0;
    if (!selectedRoom || !hasLocalItems) return 0;
    return receipts[selectedRoom].items.reduce((total, item) => {
      return total + item.price * (item.quantity || 1);
    }, 0);
  };

  const calculateRoomCharges = () => {
    if (remoteOrder?.roomCharges != null) {
      return Number(remoteOrder.roomCharges) || 0;
    }
    if (selectedRoom && receipts[selectedRoom]?.roomService) {
      const hourlyRate =
        Number(receipts[selectedRoom].roomService.hourlyRate) || 0;
      const serviceTime =
        Number(receipts[selectedRoom].roomService.serviceTime) || 0;
      return hourlyRate * serviceTime;
    }
    return 0;
  };

  const calculateVocalistCharges = () => {
    if (remoteOrder?.vocalistCharges != null) {
      return Number(remoteOrder.vocalistCharges) || 0;
    }
    if (selectedRoom && receipts[selectedRoom]?.vocalists) {
      return receipts[selectedRoom].vocalists.reduce((total, v) => {
        const hourlyRate = Number(v.hourlyRate) || 0;
        const serviceTime = Number(v.serviceTime) || 0;
        return total + hourlyRate * serviceTime;
      }, 0);
    }
    return 0;
  };

  const subtotal = calculateSubtotal();
  const roomCharges = calculateRoomCharges();
  const vocalistCharges = calculateVocalistCharges();

  const calculateTax = () => {
    if (remoteOrder?.tax != null) return Number(remoteOrder.tax) || 0;
    const baseAmount = subtotal + roomCharges + vocalistCharges;
    return baseAmount * (taxRate / 100);
  };

  const calculateServiceFee = () => {
    if (remoteOrder?.serviceFee != null)
      return Number(remoteOrder.serviceFee) || 0;
    const baseAmount = subtotal + roomCharges + vocalistCharges;
    return baseAmount * (serviceFee / 100);
  };

  const calculateDiscount = () => {
    return discountAmount || 0;
  };

  const tax = calculateTax();
  const serviceFeeAmount = calculateServiceFee();
  const discount = calculateDiscount();

  const calculateTotal = () => {
    if (remoteOrder?.total != null) return Number(remoteOrder.total) || 0;
    return (
      subtotal +
      tax +
      serviceFeeAmount -
      discount +
      roomCharges +
      vocalistCharges
    );
  };

  const total = calculateTotal();

  return {
    hasLocalItems,
    hasLocalVocalists,
    hasLocalRoomService,
    hasLocalData,
    getSentQuantity,
    getLocalQuantity,
    subtotal,
    roomCharges,
    vocalistCharges,
    tax,
    serviceFeeAmount,
    total,
  };
};

export default useKtvOrderCalculations;

