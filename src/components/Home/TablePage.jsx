import { useNavigate } from "react-router-dom";
import { selectTable, setOrderType } from "./../../redux/receiptSlice";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import getAllTables from "../../api/Table/getAllTables";
import { toast } from "sonner";
import Loading from "../Loading";

const TablePage = () => {
  const Navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  //   const orderType = useSelector(
  //     (state) => state.receipts.receipts[selectedTable]?.orderType || "Dine In"
  //   );

  //   const handleOrderTypeChange = (type) => {
  //     if (selectedTable) {
  //       dispatch(setOrderType({ table: selectedTable, orderType: type }));
  //     }
  //   };
  //   console.log(receipts);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    const res = await getAllTables();
    if (Array.isArray(res)) {
      // const activeTables = res.filter(
      //   (t) => t.status === "active" && !t.isDeleted
      // );
      setTables(res);
    } else {
      setTables([]);
      toast.error("Failed to load tables");
    }
    setLoading(false);
  };

  const handleTableSelect = (tableNumber) => {
    dispatch(selectTable(tableNumber));
    Navigate(`/order/${tableNumber}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-screen pt-10 bg-white">
      <div className="w-full px-5">
        <div className="flex justify-between items-center mb-2">
          <h2 className="sub-header">Tables</h2>
        </div>

        {/* <div className="mb-4 ">
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
        </div> */}

        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="text-gray-500 text-lg">No tables available</p>
            <button
              onClick={fetchTables}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="my-5">
            {/* <p className="text-[20px] font-semibold mb-2">Select Table</p> */}
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
              {tables.map((table) => (
                <button
                  key={table._id}
                  className={`${
                    receipts[table.tableNumber] ||
                    selectedTable === table.tableNumber
                      ? "bg-primary text-white"
                      : "bg-white text-primary"
                  } border border-gray-300 px-2 py-4 rounded-lg font-bold hover:shadow-lg transition-all`}
                  onClick={() => handleTableSelect(table.tableNumber)}
                >
                  Table {table.tableNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* <div className="flex gap-4 my-4 justify-end mt-20">
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
        </div> */}
      </div>
    </div>
  );
};

export default TablePage;
