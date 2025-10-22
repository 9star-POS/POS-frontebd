import { selectTable, setOrderType } from "./../../redux/receiptSlice";
import { useDispatch, useSelector } from "react-redux";

const TableSelection = ({ isOpen, onClose, tables }) => {
  const dispatch = useDispatch();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const orderType = useSelector(
    (state) => state.receipts.receipts[selectedTable]?.orderType || "Dine In"
  );

  const handleOrderTypeChange = (type) => {
    if (selectedTable) {
      dispatch(setOrderType({ table: selectedTable, orderType: type }));
    }
  };
  //   console.log(receipts);

  const handleTableSelect = (table) => {
    dispatch(selectTable(table));
  };

  //   console.log("tables", tables);
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80">
      <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-lg mx-5 md:mx-0 w-full md:w-[800px]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="sub-header">Table</h2>
        </div>

        <div className="mb-4 ">
          <p className="font-semibold text-[20px] mb-2">Select Dining Type</p>
          <div className="flex items-center mb-2 gap-2">
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="takeAway"
                name="diningType"
                className="mr-2"
                checked={orderType === "Take Away"}
                onChange={() => handleOrderTypeChange("Take Away")}
              />
              <label htmlFor="takeAway">Take Away</label>
            </div>

            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="dineIn"
                name="diningType"
                className="mr-2"
                checked={orderType === "Dine In"}
                onChange={() => handleOrderTypeChange("Dine In")}
              />
              <label htmlFor="dineIn">Dine In</label>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[20px] font-semibold mb-2">Select Table</p>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
            {tables.map((table) => (
              <button
                key={table}
                className={`${
                  receipts[table] || selectedTable === table
                    ? "bg-white text-primary"
                    : "bg-primary text-white"
                } border border-gray-300 p-2 rounded font-bold`}
                onClick={() => handleTableSelect(table)}
              >
                Table {table}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 my-4 justify-end mt-20">
          <button
            className="border border-gray-300 shadow-md text-primary py-2 px-4 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-primary text-white py-2 px-4 rounded"
            onClick={onClose}
          >
            Confirm Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableSelection;
