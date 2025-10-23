import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { XCircle, Plus, Minus } from "lucide-react";
import {
  removeItemFromReceipt,
  incrementQuantity,
  decrementQuantity,
  removeTable,
} from "./../../redux/receiptSlice";
import { useNavigate } from "react-router-dom";
import box from "./../../assets/box.png";
import "./../input.css";
import CalculatorModal from "./CalculatorModel";
import sendToKitchen from "../../api/Order/sendtokitchen";
import { toast } from "sonner";

function Receipt({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const [taxRate, setTaxRate] = useState(5); // Default 5% tax
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const handleRemoveItem = (itemName) => {
    dispatch(removeItemFromReceipt({ table: selectedTable, itemName }));
  };

  const handleIncrement = (itemName) => {
    dispatch(incrementQuantity({ table: selectedTable, itemName }));
  };

  const handleDecrement = (itemName) => {
    dispatch(decrementQuantity({ table: selectedTable, itemName }));
  };

  const handleTaxChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setTaxRate(value === "" ? 0 : Number(value));
    }
  };

  const calculateSubtotal = () => {
    if (!selectedTable || !receipts[selectedTable]) return 0;
    return receipts[selectedTable].items.reduce((total, item) => {
      return total + item.price * (item.quantity || 1);
    }, 0);
  };

  const calculateTax = (subtotal) => {
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const handlePayment = () => {
    if (!selectedTable || !receipts[selectedTable]?.items?.length) {
      return;
    }

    const orderData = {
      table: selectedTable,
      orderType: receipts[selectedTable].orderType,
      orders: receipts[selectedTable].items.map((item) => ({
        dishName: item.dishName,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      totalPrice: calculateSubtotal(),
      finalPrice: calculateTotal(),
      tax: taxRate / 100,
    };

    setIsCalculatorOpen(true);
  };

  const sendKitchen = async () => {
    if (!selectedTable || !receipts[selectedTable]?.items?.length) {
      toast.warning("No items to send");
      return;
    }

    const orderItems = receipts[selectedTable].items.map((item) => ({
      stockId: item._id || item.stockId,
      quantity: item.quantity || 1,
      notes: item.notes ?? "",
    }));

    const payload = {
      tableNumber: selectedTable,
      orderItems,
    };

    try {
      const res = await sendToKitchen(payload);
      if (res?.status === "success" || res?.code === 201) {
        toast.success("Order sent to kitchen successfully");
      }
    } catch (e) {
      // Error toasting handled in API layer; no-op here
    }
  };

  return (
    <div className="text-black h-screen px-3 pt-0">
      <div className="pt-2">
        <div className="flex justify-between w-full items-center mb-5">
          <p className="sub-header font-bold">Receipt</p>
          <button
            className="md:hidden bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
            onClick={() => navigate("/")}
          >
            Save
          </button>
        </div>

        {!selectedTable && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No table selected</p>
          </div>
        )}

        {selectedTable && !receipts[selectedTable]?.items?.length && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No items in receipt</p>
          </div>
        )}

        {selectedTable && receipts[selectedTable]?.items?.length > 0 && (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-500">Table {selectedTable}</p>
              <p className="text-gray-500">
                {receipts[selectedTable].orderType}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto mb-5 space-y-4">
              {receipts[selectedTable].items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-white py-3 rounded-lg shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.dishName}</p>
                    <p className="text-sm text-gray-500">
                      {item.price.toLocaleString()} MMK
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrement(item.dishName)}
                        className="p-1 rounded-md hover:bg-gray-100 text-primary"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-medium min-w-[24px] text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => handleIncrement(item.dishName)}
                        className="p-1 rounded-md hover:bg-gray-100 text-primary"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-medium min-w-[100px] text-right">
                      {(item.price * (item.quantity || 1)).toLocaleString()} MMK
                    </p>
                    {/* <button
                      onClick={() => handleRemoveItem(item.dishName)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XCircle size={20} />
                    </button> */}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-[0px] bg-white border-t">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">
                    {calculateSubtotal().toLocaleString()} MMK
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">Gov Tax</p>
                    <div className="relative">
                      <input
                        type="text"
                        value={taxRate === 0 ? "" : taxRate}
                        onChange={handleTaxChange}
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
                    {calculateTax(calculateSubtotal()).toLocaleString()} MMK
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-bold text-lg">Total</p>
                  <p className="font-bold text-lg text-primary">
                    {calculateTotal().toLocaleString()} MMK
                  </p>
                </div>
              </div>

              {/* <div className="flex gap-3 pb-5">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                >
                  Order More
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-primary text-white font-semibold py-4 rounded-full border border-primary hover:bg-primary/90 transition-colors"
                >
                  Payment
                </button>
              </div> */}
              <div className="flex gap-3 pb-5">
                <button
                  onClick={sendKitchen}
                  className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                >
                  Send to Kitchen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isCalculatorOpen && (
        <CalculatorModal
          totalPrice={calculateTotal()}
          table={selectedTable}
          orderData={{
            table: selectedTable,
            orderType: receipts[selectedTable].orderType,
            orders: receipts[selectedTable].items.map((item) => ({
              dishName: item.dishName,
              price: item.price,
              quantity: item.quantity || 1,
            })),
            totalPrice: calculateSubtotal(),
            finalPrice: calculateTotal(),
            tax: taxRate / 100,
          }}
          onClose={() => setIsCalculatorOpen(false)}
        />
      )}
    </div>
  );
}

export default Receipt;
