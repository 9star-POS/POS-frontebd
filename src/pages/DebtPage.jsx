import { useEffect, useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as DatePickerCalendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import getDebts from "../api/debt/getDebts";
import createDebt from "../api/debt/createDebt";
import deleteDebt from "../api/debt/deleteDebt";
import updateDebtStatus from "../api/debt/updateDebtStatus";
import Loading from "../components/Loading";
import NoItems from "../components/NoItems";
import DeleteModel from "../components/DeleteModel";
import Calendar from "../components/Calender";
import {
  CreditCard,
  DollarSign,
  FileText,
  Plus,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
} from "lucide-react";

const DebtPage = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [newDebt, setNewDebt] = useState({
    amount: "",
    customerName: "",
    tabelOrRoom: "",
    manualDate: format(new Date(), "yyyy-MM-dd"),
    manualDateDisplay: format(new Date(), "dd/MM/yyyy"),
    manualTime: format(new Date(), "HH:mm"),
  });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState(null);
  const [updatingDebtId, setUpdatingDebtId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "paid", "unpaid"
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Initialize filters from sessionStorage or default to today
  const [filters, setFilters] = useState(() => {
    const savedFilters = sessionStorage.getItem("debtTrackerDateRange");

    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.startDate && parsed.endDate) {
          return {
            startDate: parsed.startDate,
            endDate: parsed.endDate,
          };
        }
      } catch (e) {
        console.error("Error parsing saved date range:", e);
      }
    }

    return {
      startDate: today,
      endDate: today,
    };
  });

  const fetchDebts = async (overrideFilters) => {
    setLoading(true);
    try {
      const appliedFilters = overrideFilters ?? filters;
      const response = await getDebts(appliedFilters);
      if (response?.success) {
        const debtsData = response.data || [];
        // Filter out deleted debts
        const activeDebts = debtsData.filter((debt) => !debt.isDeleted);
        setDebts(activeDebts);
      } else {
        setDebts([]);
      }
    } catch (error) {
      console.error("Error fetching debts:", error);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateTotalDebt = () => {
    return debts.reduce((total, debt) => total + (debt.amount || 0), 0);
  };

  const calculateUnpaidDebt = () => {
    return debts
      .filter((debt) => debt.status === "unpaid")
      .reduce((total, debt) => total + (debt.amount || 0), 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString();
  };

  const getStatusBadge = (status) => {
    if (status === "paid") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
        Unpaid
      </span>
    );
  };

  const unpaidCount = debts.filter((debt) => debt.status === "unpaid").length;

  // Filter debts based on status filter
  const getFilteredDebts = () => {
    if (statusFilter === "all") {
      return debts;
    }
    return debts.filter((debt) => debt.status === statusFilter);
  };

  const filteredDebts = getFilteredDebts();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Convert dd/mm/yyyy to yyyy-MM-dd for API
  const parseDateFromDisplay = (displayDate) => {
    if (!displayDate) return "";
    try {
      const [day, month, year] = displayDate.split("/");
      if (
        day &&
        month &&
        year &&
        day.length === 2 &&
        month.length === 2 &&
        year.length === 4
      ) {
        return `${year}-${month}-${day}`;
      }
      return "";
    } catch (error) {
      return "";
    }
  };

  // Format date input as user types (dd/mm/yyyy)
  const handleDateInputChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    // Format as dd/mm/yyyy
    if (value.length > 0) {
      if (value.length <= 2) {
        value = value;
      } else if (value.length <= 4) {
        value = value.slice(0, 2) + "/" + value.slice(2);
      } else {
        value =
          value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4, 8);
      }
    }

    // Update display value
    const displayValue = value;

    // Convert to yyyy-MM-dd format for internal storage
    const internalValue = parseDateFromDisplay(displayValue);

    setNewDebt((prev) => ({
      ...prev,
      manualDate: internalValue || prev.manualDate,
      manualDateDisplay: displayValue,
    }));
  };

  // Handle date selection from calendar picker
  const handleDateSelect = (date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "dd/MM/yyyy");

    setNewDebt((prev) => ({
      ...prev,
      manualDate: formattedDate,
      manualDateDisplay: displayDate,
    }));

    setShowDatePicker(false);
  };

  // Validate date format (dd/mm/yyyy)
  const isValidDate = (dateString) => {
    if (!dateString || dateString.length !== 10) return false;
    const [day, month, year] = dateString.split("/");
    if (!day || !month || !year) return false;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;

    // Check if date is valid
    const date = new Date(yearNum, monthNum - 1, dayNum);
    return (
      date.getFullYear() === yearNum &&
      date.getMonth() === monthNum - 1 &&
      date.getDate() === dayNum
    );
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    const today = format(new Date(), "yyyy-MM-dd");
    const todayDisplay = format(new Date(), "dd/MM/yyyy");
    const currentTime = format(new Date(), "HH:mm");
    setNewDebt({
      amount: "",
      customerName: "",
      tabelOrRoom: "",
      manualDate: today,
      manualDateDisplay: todayDisplay,
      manualTime: currentTime,
    });
  };

  const handleCreateDebt = async () => {
    // Validate form
    if (!newDebt.amount || !newDebt.customerName || !newDebt.tabelOrRoom) {
      return;
    }

    if (!newDebt.manualDateDisplay || !isValidDate(newDebt.manualDateDisplay)) {
      return;
    }

    setIsCreating(true);
    try {
      // Convert manualDate and manualTime to ISO 8601 format with timezone
      let manualDateUTC = "";
      if (newDebt.manualDate) {
        const timePart = newDebt.manualTime || "00:00";
        const [hours, minutes] = timePart
          .split(":")
          .map((v) => parseInt(v, 10));
        const [year, month, day] = newDebt.manualDate
          .split("-")
          .map((v) => parseInt(v, 10));

        if (
          !Number.isNaN(year) &&
          !Number.isNaN(month) &&
          !Number.isNaN(day) &&
          !Number.isNaN(hours) &&
          !Number.isNaN(minutes)
        ) {
          const utcDate = new Date(
            Date.UTC(year, month - 1, day, hours, minutes, 0, 0)
          );
          manualDateUTC = utcDate.toISOString().replace("Z", "+00:00");
        }
      }

      const response = await createDebt({
        amount: parseFloat(newDebt.amount),
        customerName: newDebt.customerName.trim(),
        tabelOrRoom: newDebt.tabelOrRoom.trim(),
        manualDate: manualDateUTC,
      });

      if (response?.success) {
        handleCloseModal();
        // Refresh the debts list
        fetchDebts(filters);
      }
    } catch (error) {
      console.error("Error creating debt:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (debt) => {
    setDebtToDelete(debt);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!debtToDelete) return;

    try {
      const response = await deleteDebt(debtToDelete._id);
      if (response?.success) {
        setIsDeleteOpen(false);
        setDebtToDelete(null);
        // Refresh the debts list
        fetchDebts(filters);
      }
    } catch (error) {
      console.error("Error deleting debt:", error);
    }
  };

  const handleDateRangeChange = (dates) => {
    const newFilters = {
      startDate: dates.startDate,
      endDate: dates.endDate,
    };
    setFilters(newFilters);
    // Save to sessionStorage (clears when browser closes)
    sessionStorage.setItem("debtTrackerDateRange", JSON.stringify(newFilters));
    fetchDebts(newFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = { startDate: today, endDate: today };
    setFilters(resetFilters);
    // Save to sessionStorage (clears when browser closes)
    sessionStorage.setItem(
      "debtTrackerDateRange",
      JSON.stringify(resetFilters)
    );
    fetchDebts(resetFilters);
  };

  const handleStatusChange = async (debt) => {
    if (updatingDebtId === debt._id) return; // Prevent multiple clicks

    const newStatus = debt.status === "paid" ? "unpaid" : "paid";
    setUpdatingDebtId(debt._id);

    try {
      const response = await updateDebtStatus(debt._id, newStatus);
      if (response?.success) {
        // Refresh the debts list
        fetchDebts(filters);
      }
    } catch (error) {
      console.error("Error updating debt status:", error);
    } finally {
      setUpdatingDebtId(null);
    }
  };

  return (
    <div className="p-5">
      <div className="min-h-screen">
        <div className="md:flex justify-between mb-5">
          <h1 className="sub-header font-bold">Debt Tracker</h1>
          <div className="flex gap-2 flex-wrap justify-end">
            <Calendar
              sendDate={handleDateRangeChange}
              selectedStartDate={filters.startDate}
              selectedEndDate={filters.endDate}
              defaultStartDate={today}
              defaultEndDate={today}
            />
            {(filters.startDate !== today || filters.endDate !== today) && (
              <button
                onClick={handleResetFilters}
                className="border border-gray-300 px-4 py-2 rounded-md transition-all hover:bg-gray-100 font-semibold"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleOpenModal}
              className="bg-primary text-white px-4 py-2 rounded-md transition-all hover:bg-primary/90 font-semibold flex items-center gap-2"
            >
              <Plus size={18} />
              Add Debt
            </button>
            <button
              onClick={() => fetchDebts(filters)}
              className="border border-gray-300 px-4 py-2 rounded-md transition-all hover:bg-gray-100 font-semibold"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                statusFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("unpaid")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                statusFilter === "unpaid"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setStatusFilter("paid")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                statusFilter === "paid"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Total Debt</h3>
                <p className="text-[36px] font-futura text-primary">
                  {formatCurrency(calculateTotalDebt())} MMK
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-primary opacity-50" />
            </div>
          </div>

          <div className="border-l-4 border-red-500 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Unpaid Debt</h3>
                <p className="text-[36px] font-futura text-red-500">
                  {formatCurrency(calculateUnpaidDebt())} MMK
                </p>
              </div>
              <CreditCard className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Unpaid Records</h3>
                <p className="text-[36px] font-futura text-primary">
                  {unpaidCount}
                </p>
              </div>
              <FileText className="w-12 h-12 text-primary opacity-50" />
            </div>
          </div>
        </div>

        {/* Debts Table */}
        {loading ? (
          <div>
            <Loading />
          </div>
        ) : (
          <div className="bg-white w-full rounded-lg overflow-hidden">
            {filteredDebts && filteredDebts.length === 0 ? (
              <div className="flex justify-center items-center mt-20">
                <NoItems
                  header={
                    statusFilter === "all"
                      ? "No Debts"
                      : statusFilter === "paid"
                      ? "No Paid Debts"
                      : "No Unpaid Debts"
                  }
                  subHeader={
                    statusFilter === "all"
                      ? "No debt records found"
                      : statusFilter === "paid"
                      ? "No paid debt records found"
                      : "No unpaid debt records found"
                  }
                />
              </div>
            ) : (
              <div className="shadow-lg h-[calc(100vh-400px)] overflow-y-auto border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-primary sticky top-0">
                    <tr className="font-bold text-md md:text-lg">
                      <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        No
                      </th>
                      <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        Amount
                      </th>
                      <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        Status
                      </th>
                      {/* <th className="hidden md:block px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        Order Type
                      </th> */}
                      <th className="hidden lg:block px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        Table/Room
                      </th>
                      <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        Created Date
                      </th>
                      <th className="px-2 lg:px-6 py-4 text-left text-md font-semibold text-white tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDebts.map((debt, index) => {
                      // Calculate the row number based on filtered results
                      const rowNumber = index + 1;
                      return (
                        <tr
                          key={debt._id}
                          className="font-bold text-md md:text-lg hover:bg-gray-50"
                        >
                          <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                            {rowNumber}
                          </td>
                          <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {debt.customerName || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-primary">
                              {formatCurrency(debt.amount || 0)} MMK
                            </div>
                          </td>
                          <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(debt.status)}
                          </td>
                          {/* <td className="hidden md:block px-2 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {debt.orderType || "N/A"}
                          </div>
                        </td> */}
                          <td className="hidden lg:block px-2 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {debt.tabelOrRoom || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(debt.manualDate)}
                            </div>
                          </td>
                          <td className="px-2 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStatusChange(debt)}
                                disabled={updatingDebtId === debt._id}
                                className={`px-3 py-3 rounded-md text-sm justify-center font-semibold transition-all flex items-center gap-1 ${
                                  debt.status === "paid"
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    : "bg-green-100 text-green-800 hover:bg-green-200"
                                } ${
                                  updatingDebtId === debt._id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title={
                                  debt.status === "paid"
                                    ? "Mark as Unpaid"
                                    : "Mark as Paid"
                                }
                              >
                                {updatingDebtId === debt._id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : debt.status === "paid" ? (
                                  <XCircle size={20} />
                                ) : (
                                  <CheckCircle size={20} />
                                )}
                                {/* {debt.status === "paid" ? "Unpaid" : "Paid"} */}
                              </button>
                              <button
                                onClick={() => handleDeleteClick(debt)}
                                className="px-3 py-3 rounded-md text-sm font-semibold bg-red-100 text-red-800 hover:bg-red-200 transition-all flex items-center gap-1"
                                title="Delete debt"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Debt Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b">
                <h3 className="text-lg font-bold">Add New Debt</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isCreating}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDebt.customerName}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, customerName: e.target.value })
                    }
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (MMK) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newDebt.amount}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, amount: e.target.value })
                    }
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    min="0"
                    step="0.01"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table/Room <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDebt.tabelOrRoom}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, tabelOrRoom: e.target.value })
                    }
                    placeholder="Enter table or room number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isCreating}
                  />
                </div>

                <div className="relative" ref={datePickerRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">
                      (dd/mm/yyyy)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newDebt.manualDateDisplay || ""}
                      onChange={handleDateInputChange}
                      placeholder="dd/mm/yyyy"
                      maxLength={10}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      disabled={isCreating}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      disabled={isCreating}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-primary transition-colors"
                      title="Open calendar"
                    >
                      <CalendarIcon size={20} />
                    </button>
                  </div>
                  {showDatePicker && (
                    <div className="absolute z-50 top-[-300px] mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                      <DatePickerCalendar
                        date={
                          newDebt.manualDate
                            ? new Date(newDebt.manualDate)
                            : new Date()
                        }
                        onChange={handleDateSelect}
                        color="#2b2f33"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time{" "}
                    <span className="text-xs text-gray-500 ml-2">(HH:mm)</span>
                  </label>
                  <input
                    type="time"
                    value={newDebt.manualTime || ""}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, manualTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-5">
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDebt}
                    disabled={
                      isCreating ||
                      !newDebt.amount ||
                      !newDebt.customerName.trim() ||
                      !newDebt.tabelOrRoom.trim()
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
                      isCreating ||
                      !newDebt.amount ||
                      !newDebt.customerName.trim() ||
                      !newDebt.tabelOrRoom.trim()
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Debt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteModel
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setDebtToDelete(null);
          }}
          submit={handleConfirmDelete}
          text={
            debtToDelete
              ? `Are you sure you want to delete debt for ${debtToDelete.customerName}?`
              : "Are you sure you want to delete this debt?"
          }
        />
      </div>
    </div>
  );
};

export default DebtPage;
