import { useEffect, useState } from "react";
import { toast } from "sonner";

const CalculatorModal = ({ total, onClose, onConfirm }) => {
  const [paidPrice, setPaidPrice] = useState(total);
  const [extraChange, setExtraChange] = useState(0);

  const handleCalculate = () => {
    const change = parseFloat(paidPrice) - total;
    setExtraChange(change >= 0 ? change : 0);
  };

  useEffect(() => {
    handleCalculate();
  }, [paidPrice]);

  const confirmPaymentClick = () => {
    if (parseFloat(paidPrice) < total) {
      toast.error("Pls Checkout Again");
      return;
    }
    if (typeof onConfirm === "function") {
      onConfirm({
        paidPrice: parseFloat(paidPrice),
        extraChange: parseFloat(extraChange),
      });
    }
  };

  return (
    <div className="fixed inset-0 flex md:pb-0 px-2 justify-center md:justify-end md:items-start bg-white bg-opacity-80">
      <div className="bg-white rounded-lg shadow-lg px-4 py-6 md:p-6 w-full md:w-[450px] mt-20 md:me-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="sub-header">Calculator</h2>
          <button
            className="text-gray-500 text-3xl text-primary"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2 text-sm md:text-lg px-1 md:px-4">
            <label className="font-medium">Total Price</label>
            <span>{total.toLocaleString()} MMK</span>
          </div>
          <div className="flex justify-between text-sm md:text-lg items-center mb-2 border border-primary rounded-md px-1 md:px-4 py-2">
            <label className="font-medium">Paid Price</label>
            <div>
              <input
                type="number"
                value={paidPrice}
                onChange={(e) => setPaidPrice(e.target.value)}
                placeholder="Enter paid price"
                className="py-1 text-right"
                autoFocus
              />
              <span> MMK</span>
            </div>
          </div>
          <div className="flex justify-between mb-2 px-1 md:px-4">
            <label className="font-medium">Extra Change</label>
            <span>{extraChange.toLocaleString()} MMK</span>
          </div>
        </div>
        <div className="flex justify-between gap-5 mt-10">
          <button
            className="border text-xl font-bold border-gray-300 text-primary w-full rounded-xl py-4 px-4"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-primary text-xl font-bold w-full text-white rounded-xl py-4 px-4"
            onClick={confirmPaymentClick}
          >
            ConFirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
