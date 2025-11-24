import React, { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import getExpenses from "../api/expense/getExpenses";
import addExpense from "../api/expense/addExpense";
import { format } from "date-fns";
import Calendar from "../components/Calender";
import { Calendar as DatePickerCalendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  DollarSign,
  Calendar as CalendarIcon,
  FileText,
  TrendingUp,
  Plus,
  X,
  Eye,
} from "lucide-react";

const ExpenseTrackerPage = () => {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expense: "",
    manualDate: format(new Date(), "yyyy-MM-dd"),
    manualDateDisplay: format(new Date(), "dd/MM/yyyy"),
    manualTime: format(new Date(), "HH:mm"),
  });
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  // Initialize filters from sessionStorage or default to today
  // sessionStorage automatically clears when browser closes, so it resets to today
  const [filters, setFilters] = useState(() => {
    const savedFilters = sessionStorage.getItem("expenseTrackerDateRange");

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

  const fetchExpenses = async (overrideFilters) => {
    setLoading(true);
    try {
      const appliedFilters = overrideFilters ?? filters;
      const response = await getExpenses(appliedFilters);
      console.log("Expenses Response:", response);
      if (response?.success) {
        const expensesData = response.data || [];
        // Filter out deleted expenses
        const activeExpenses = expensesData.filter(
          (expense) => !expense.isDeleted
        );
        setExpenses(activeExpenses);
        toast.success("Expenses fetched successfully");
      } else {
        toast.error("Failed to fetch expenses");
      }
    } catch (error) {
      toast.error("Error fetching expenses");
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateTotal = () => {
    return expenses.reduce(
      (total, expense) => total + (expense.expense || 0),
      0
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString();
  };

  // Convert yyyy-MM-dd to dd/mm/yyyy for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
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

    setFormData((prev) => ({
      ...prev,
      manualDate: internalValue || prev.manualDate,
      manualDateDisplay: displayValue,
    }));
  };

  // Handle date selection from calendar picker
  const handleDateSelect = (date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "dd/MM/yyyy");

    setFormData((prev) => ({
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

  const handleDateRangeChange = (dates) => {
    const newFilters = {
      startDate: dates.startDate,
      endDate: dates.endDate,
    };
    setFilters(newFilters);
    // Save to sessionStorage (clears when browser closes)
    sessionStorage.setItem(
      "expenseTrackerDateRange",
      JSON.stringify(newFilters)
    );
    fetchExpenses(newFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = { startDate: today, endDate: today };
    setFilters(resetFilters);
    // Save to sessionStorage (clears when browser closes)
    sessionStorage.setItem(
      "expenseTrackerDateRange",
      JSON.stringify(resetFilters)
    );
    fetchExpenses(resetFilters);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.expense || parseFloat(formData.expense) <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }
    if (
      !formData.manualDateDisplay ||
      !isValidDate(formData.manualDateDisplay)
    ) {
      toast.error("Please enter a valid date in dd/mm/yyyy format");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert manualDate and manualTime to ISO 8601 format with Myanmar timezone (UTC+6:30)
      let manualDateUTC = "";
      if (formData.manualDate) {
        // Combine date and time (default to 00:00 if time not provided)
        const timePart = formData.manualTime || "00:00";

        // Parse date and time inputs
        const [hours, minutes] = timePart.split(":");
        const [year, month, day] = formData.manualDate.split("-");

        // Format as ISO 8601 with Myanmar timezone offset (+06:30)
        const yearStr = year;
        const monthStr = month.padStart(2, "0");
        const dayStr = day.padStart(2, "0");
        const hourStr = hours.padStart(2, "0");
        const minuteStr = minutes.padStart(2, "0");
        const secondStr = "00";
        const millisecondStr = "000";

        manualDateUTC = `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondStr}.${millisecondStr}+06:30`;
      }

      const expenseData = {
        title: formData.title.trim(),
        description: formData.description.trim() || "",
        expense: parseFloat(formData.expense),
        manualDate: manualDateUTC,
      };

      // console.log("Expense Data:", expenseData);

      const response = await addExpense(expenseData);

      if (response?.success) {
        toast.success("Expense added successfully");
        setIsModalOpen(false);
        const today = format(new Date(), "yyyy-MM-dd");
        const todayDisplay = format(new Date(), "dd/MM/yyyy");
        setFormData({
          title: "",
          description: "",
          expense: "",
          manualDate: today,
          manualDateDisplay: todayDisplay,
        });
        // Refresh expenses list
        fetchExpenses();
      } else {
        toast.error(response.message || "Failed to add expense");
      }
    } catch (error) {
      toast.error("Error adding expense");
      console.error("Error adding expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    const today = format(new Date(), "yyyy-MM-dd");
    const todayDisplay = format(new Date(), "dd/MM/yyyy");
    const currentTime = format(new Date(), "HH:mm");
    setFormData({
      title: "",
      description: "",
      expense: "",
      manualDate: today,
      manualDateDisplay: todayDisplay,
      manualTime: currentTime,
    });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-5">
        <h1 className="sub-header font-bold">Expense Tracker</h1>
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
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Expense
          </button>
          <button
            onClick={() => fetchExpenses(filters)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 font-semibold"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
              <p className="text-[36px] font-futura text-primary">
                {formatCurrency(calculateTotal())} MMK
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-primary opacity-50" />
          </div>
        </div>

        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Records</h3>
              <p className="text-[36px] font-futura text-primary">
                {expenses.length}
              </p>
            </div>
            <FileText className="w-12 h-12 text-primary opacity-50" />
          </div>
        </div>

        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Average Expense</h3>
              <p className="text-[36px] font-futura text-primary">
                {expenses.length > 0
                  ? formatCurrency(
                      Math.round(calculateTotal() / expenses.length)
                    )
                  : "0"}{" "}
                MMK
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-primary opacity-50" />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg overflow-hidden pb-10">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No expenses found. Add your first expense to get started.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.title || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {expense.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-primary">
                        {formatCurrency(expense.expense || 0)} MMK
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        {formatDate(expense.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        title="View Details"
                      >
                        <Eye size={18} />
                        <span className="text-sm">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold">Add New Expense</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Electricity, Rent, Supplies"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g., Bill for this month"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (MMK) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="expense"
                    value={formData.expense}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isSubmitting}
                    required
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
                      name="manualDate"
                      value={formData.manualDateDisplay || ""}
                      onChange={handleDateInputChange}
                      placeholder="dd/mm/yyyy"
                      maxLength={10}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      disabled={isSubmitting}
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
                          formData.manualDate
                            ? new Date(formData.manualDate)
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
                    name="manualTime"
                    value={formData.manualTime || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {isDetailModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold">Expense Details</h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedExpense(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Title
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedExpense.title || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Description
                </label>
                <div className="text-base text-gray-900 whitespace-pre-wrap break-words bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px]">
                  {selectedExpense.description || "No description provided"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Amount
                </label>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedExpense.expense || 0)} MMK
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Date Created
                </label>
                <div className="text-base text-gray-900 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-gray-400" />
                  {formatDate(selectedExpense.manualDate)}
                </div>
              </div>

              {selectedExpense.updatedAt &&
                selectedExpense.updatedAt !== selectedExpense.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Last Updated
                    </label>
                    <div className="text-base text-gray-900 flex items-center gap-2">
                      <CalendarIcon size={18} className="text-gray-400" />
                      {formatDate(selectedExpense.updatedAt)}
                    </div>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t p-5 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedExpense(null);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTrackerPage;
