import { useNavigate } from "react-router-dom";
import { selectTable, setOrderType } from "./../../redux/receiptSlice";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useCallback } from "react";
import getAllTables from "../../api/Table/getAllTables";
import getDeletedTables from "../../api/Table/getDeletedTables";
import restoreTableService from "../../api/Table/restoreTableService";
import { toast } from "sonner";
import Loading from "../Loading";
import CreateTableModal from "./CreateTableModal";
import EditTableModal from "./EditTableModal";
import { Edit2, Archive, List, RotateCcw } from "lucide-react";

const TablePage = () => {
  const Navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tableToEdit, setTableToEdit] = useState(null);
  const [viewMode, setViewMode] = useState("active"); // "active" or "archived"
  const [restoringTableId, setRestoringTableId] = useState(null);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    const res = await getAllTables();
    // console.log("tables", res);

    if (res?.success && Array.isArray(res.data)) {
      // const activeTables = res.filter(
      //   (t) => t.status === "active" && !t.isDeleted
      // );
      setTables(res.data);
    } else {
      setTables([]);
      toast.error(res?.message || "Failed to load tables");
    }
    setLoading(false);
  }, []);

  const fetchArchivedTables = useCallback(async () => {
    setLoading(true);
    const res = await getDeletedTables();
    // console.log("archived tables", res);

    if (res?.success && Array.isArray(res.data)) {
      setTables(res.data);
    } else {
      setTables([]);
      toast.error(res?.message || "Failed to load archived tables");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (viewMode === "active") {
      fetchTables();
    } else {
      fetchArchivedTables();
    }
  }, [viewMode, fetchTables, fetchArchivedTables]);

  // console.log(tables);

  const handleTableSelect = (tableNumber, isArchived) => {
    if (isArchived) {
      toast.info("Cannot select archived table");
      return;
    }
    dispatch(selectTable(tableNumber));
    Navigate(`/${tableNumber}`);
  };

  const handleEditTable = (e, table, isArchived) => {
    e.stopPropagation();
    if (isArchived) {
      toast.info("Cannot edit archived table");
      return;
    }
    if (!table?._id) return;
    setTableToEdit(table);
    setIsEditModalOpen(true);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleRestoreTable = async (e, table) => {
    e.stopPropagation();
    if (!table?._id) return;

    setRestoringTableId(table._id);
    try {
      const res = await restoreTableService(table._id);
      if (res?.success) {
        toast.success(res?.message || "Table restored successfully");
        // Refresh archived tables list
        fetchArchivedTables();
      }
    } catch (error) {
      // console.error("Error restoring table:", error);
    } finally {
      setRestoringTableId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex pt-5 h-[calc(100vh-90px)]   bg-white">
      <div className="w-full px-5">
        <div className="flex justify-between items-center mb-2">
          <h2 className="sub-header">Tables</h2>
          <div className="flex gap-2 items-center">
            {/* <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => handleViewModeChange("active")}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === "active"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <List size={18} />
                Active
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("archived")}
                className={`px-4 py-2 flex items-center gap-2 transition-colors border-l border-gray-300 ${
                  viewMode === "archived"
                    ? "bg-gray-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Archive size={18} />
                Archived
              </button>
            </div> */}
            <button
              type="button"
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
              onClick={
                viewMode === "active" ? fetchTables : fetchArchivedTables
              }
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              className="rounded-md border border-primary bg-primary px-4 py-2 text-white transition hover:bg-white hover:text-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Table
            </button>
          </div>
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
            <p className="text-gray-500 text-lg">
              {viewMode === "archived"
                ? "No archived tables found"
                : "No tables available"}
            </p>
            <button
              onClick={
                viewMode === "active" ? fetchTables : fetchArchivedTables
              }
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="my-5">
            {viewMode === "archived" && (
              <p className="text-sm text-gray-500 mb-3">
                Archived tables can be restored to make them active again
              </p>
            )}
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
              {tables.map((table) => {
                const isActive = table.status === "active";
                const isArchived = viewMode === "archived" || table.isDeleted;

                const buttonClasses = isArchived
                  ? "border border-gray-400 bg-gray-200 text-gray-600 px-2 py-4 rounded-lg font-bold opacity-75 cursor-not-allowed"
                  : isActive
                  ? "border border-green-300 bg-primary text-white px-2 py-4 rounded-lg font-bold hover:shadow-lg transition-all"
                  : "border border-gray-300 bg-white text-primary px-2 py-4 rounded-lg font-bold hover:shadow-lg transition-all";

                return (
                  <button
                    key={table._id}
                    className={`${buttonClasses} relative flex flex-col items-center`}
                    onClick={() =>
                      handleTableSelect(table.tableNumber, isArchived)
                    }
                    disabled={isArchived}
                  >
                    <span>Table {table.tableNumber}</span>
                    {isArchived && (
                      <span className="text-xs mt-1 opacity-70">
                        (Archived)
                      </span>
                    )}
                    {isArchived && (
                      <div className="absolute -top-2 -right-1">
                        <button
                          type="button"
                          className="p-1 rounded-md bg-white/80 hover:bg-green-50 border border-green-200 text-green-600"
                          onClick={(e) => handleRestoreTable(e, table)}
                          disabled={restoringTableId === table._id}
                          title="Restore table"
                        >
                          {restoringTableId === table._id ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <RotateCcw size={14} />
                          )}
                        </button>
                      </div>
                    )}
                    {!isArchived && (
                      <div className="absolute -top-2 -right-1">
                        <button
                          type="button"
                          className="p-1 rounded-md bg-white/80 hover:bg-blue-50 border border-blue-200 text-blue-500"
                          onClick={(e) => handleEditTable(e, table, isArchived)}
                          disabled={isEditModalOpen}
                          title="Edit table"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </button>
                );
              })}
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
      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchTables();
        }}
      />
      <EditTableModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTableToEdit(null);
        }}
        table={tableToEdit}
        onSuccess={() => {
          fetchTables();
        }}
      />
    </div>
  );
};

export default TablePage;
