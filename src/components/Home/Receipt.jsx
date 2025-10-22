import { useDispatch, useSelector } from "react-redux";
import { CiSquareMinus } from "react-icons/ci";
import { removeItemFromReceipt } from "../../redux/receiptSlice";
import { useState } from "react";
import CalculatorModal from "./CalculatorModel";
import { removeTable } from "./../../redux/receiptSlice";
import box from "./../../assets/box.png";
import "./../input.css";

function Receipt() {
  const dispatch = useDispatch();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(5); // Default tax is 5%
  const [orderData, setOrderData] = useState(null);

  // Access the current table's receipt items and orderType
  const currentReceipt = receipts[selectedTable]?.items || [];
  const orderType = receipts[selectedTable]?.orderType || "Dine In";

  const cancelAllItem = () => {
    dispatch(removeTable(selectedTable));
  };

  // Function to calculate total price, tax, and item counts
  const calculateTotalAndCounts = () => {
    const counts = {};
    let total = 0;

    currentReceipt.forEach((item) => {
      counts[item.dishName] = (counts[item.dishName] || 0) + 1;
      total += item.price;
    });

    const tax = total * (taxPercentage / 100); // Dynamic tax calculation
    const totalWithTax = total + tax;

    return { counts, total, tax, totalWithTax };
  };

  const confirmOrderClick = async () => {
    const orders = Object.entries(counts).map(([dishName, quantity]) => ({
      dishName,
      price: currentReceipt.find((item) => item.dishName === dishName).price,
      quantity,
    }));

    const orderData = {
      table: selectedTable,
      orderType, // Use the stored orderType for the table
      orders,
      totalPrice: total,
      finalPrice: totalWithTax,
      tax: taxPercentage / 100,
    };

    setOrderData(orderData);
    setIsModalOpen(true);
  };

  const handleRemoveItem = (itemName) => {
    if (selectedTable !== null) {
      dispatch(removeItemFromReceipt({ table: selectedTable, itemName }));
    }
  };

  const handleTaxInputChange = (e) => {
    let value = e.target.value;

    // Remove leading zeros
    if (value.length > 1 && value.startsWith(0)) {
      value = value.replace(/^0+/, "");
    }

    setTaxPercentage(value ? value : 0); // Handle empty input case
  };

  const { counts, total, tax, totalWithTax } = calculateTotalAndCounts();

  return (
    <div className="text-black h-screen overflow-y-auto pt-2 pb-40">
      <div className="px-5">
        <p className="sub-header font-bold mb-5">Receipt</p>
        {!selectedTable && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" />
            <p className="sub-header">There is no order yet!</p>
            <span className="text-gray-500 text-center">
              Please select table and take order from customer.
            </span>
          </div>
        )}
        {selectedTable && (
          <div>
            <p className="text-lg font-semibold mb-5">
              Table {selectedTable} - {orderType} Order
            </p>
            <div className="receipt">
              {Object.keys(counts).map((itemName, index) => (
                <div key={itemName} className="font-medium mb-2 flex">
                  <span className="me-2">{index + 1}.</span>{" "}
                  <span className="w-1/3 font-bold">{itemName}</span>{" "}
                  <div className="w-1/3 flex font-semibold">
                    <span> {counts[itemName]} pcs</span>
                    <div>
                      <button
                        className="ms-3"
                        onClick={() => handleRemoveItem(itemName)}
                      >
                        <CiSquareMinus size={20} />
                      </button>
                    </div>
                  </div>
                  <span className="w-1/3 text-right">
                    {counts[itemName] *
                      currentReceipt.find((item) => item.dishName === itemName)
                        .price}
                    MMK
                  </span>
                </div>
              ))}
              <div className="font-medium mb-5 flex border-b-4"></div>
              <div className="flex justify-between items-center font-bold text-md">
                <span>Subtotal</span> <span>{total.toLocaleString()} MMK</span>
              </div>
              <div className="font-medium my-5 flex border-b-4"></div>
              <div className="flex justify-between items-center font-bold text-md">
                <div className="flex w-2/3">
                  <label className="font-semibold text-md w-1/2">Gov Tax</label>
                  <input
                    type="number"
                    value={taxPercentage}
                    onChange={handleTaxInputChange}
                    className="ml-3 text-sm px-2 py-1 border border-black rounded-md"
                    min="0"
                    max="100"
                  />
                </div>
                <span className="w-1/3 text-right">
                  {tax.toLocaleString()} MMK
                </span>
              </div>
              <div className="font-medium mt-5 flex border-b-4"></div>
              <div className="flex justify-between items-center mt-5 font-bold text-xl">
                <span>Total</span>{" "}
                <span>{totalWithTax.toLocaleString()} MMK</span>
              </div>
            </div>
            <div className="flex gap-5 mt-5">
              <button
                className="bg-white w-full text-primary md:text-xl font-bold px-4 py-2 rounded-md transition duration-200 border border-gray-300 focus:outline-none focus:scale-105"
                onClick={() => cancelAllItem()}
              >
                Delete All Orders
              </button>

              <button
                onClick={() => confirmOrderClick()}
                className="bg-primary w-full text-white md:text-xl font-bold px-4 py-2 rounded-md transition duration-200 border border-primary focus:outline-none focus:scale-105"
              >
                Confirm Order
              </button>
            </div>
          </div>
        )}
        <div className="">
          {isModalOpen && (
            <CalculatorModal
              totalPrice={totalWithTax}
              table={selectedTable}
              orderData={orderData}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Receipt;
