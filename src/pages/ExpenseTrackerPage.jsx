import React, { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import getExpenses from "../api/expense/getExpenses";
import addExpense from "../api/expense/addExpense";
import updateExpense from "../api/expense/updateExpense";
import deleteExpense from "../api/expense/deleteExpense";
import { format } from "date-fns";
import DeleteModel from "../components/DeleteModel";
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
  Trash2,
  Edit,
} from "lucide-react";

const ExpenseTrackerPage = () => {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
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
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
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

      let response;
      if (editingExpenseId) {
        // Update existing expense
        response = await updateExpense(editingExpenseId, expenseData);
        if (response?.success) {
          toast.success("Expense updated successfully");
          setIsModalOpen(false);
          setEditingExpenseId(null);
          const today = format(new Date(), "yyyy-MM-dd");
          const todayDisplay = format(new Date(), "dd/MM/yyyy");
          setFormData({
            title: "",
            description: "",
            expense: "",
            manualDate: today,
            manualDateDisplay: todayDisplay,
            manualTime: format(new Date(), "HH:mm"),
          });
          // Refresh expenses list
          fetchExpenses(filters);
        } else {
          toast.error(response.message || "Failed to update expense");
        }
      } else {
        // Add new expense
        response = await addExpense(expenseData);
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
            manualTime: format(new Date(), "HH:mm"),
          });
          // Refresh expenses list
          fetchExpenses(filters);
        } else {
          toast.error(response.message || "Failed to add expense");
        }
      }
    } catch (error) {
      toast.error(
        editingExpenseId ? "Error updating expense" : "Error adding expense"
      );
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpenseId(null);
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

  const handleEditClick = (expense) => {
    setEditingExpenseId(expense._id || expense.id);

    // Parse the manualDate from the expense
    let dateValue = "";
    let dateDisplay = "";
    let timeValue = "00:00";

    if (expense.manualDate) {
      try {
        // Parse ISO date string (e.g., "2024-12-10T15:01:22.892Z" or "2024-12-10T15:01:22.892+06:30")
        const dateObj = new Date(expense.manualDate);
        if (!isNaN(dateObj.getTime())) {
          // Extract date parts
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const hours = String(dateObj.getHours()).padStart(2, "0");
          const minutes = String(dateObj.getMinutes()).padStart(2, "0");

          dateValue = `${year}-${month}-${day}`;
          dateDisplay = `${day}/${month}/${year}`;
          timeValue = `${hours}:${minutes}`;
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    }

    // If manualDate parsing failed, try createdAt
    if (!dateValue && expense.createdAt) {
      try {
        const dateObj = new Date(expense.createdAt);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const hours = String(dateObj.getHours()).padStart(2, "0");
          const minutes = String(dateObj.getMinutes()).padStart(2, "0");

          dateValue = `${year}-${month}-${day}`;
          dateDisplay = `${day}/${month}/${year}`;
          timeValue = `${hours}:${minutes}`;
        }
      } catch (error) {
        console.error("Error parsing createdAt:", error);
      }
    }

    // Default to today if still no date
    if (!dateValue) {
      dateValue = format(new Date(), "yyyy-MM-dd");
      dateDisplay = format(new Date(), "dd/MM/yyyy");
      timeValue = format(new Date(), "HH:mm");
    }

    setFormData({
      title: expense.title || "",
      description: expense.description || "",
      expense: expense.expense || "",
      manualDate: dateValue,
      manualDateDisplay: dateDisplay,
      manualTime: timeValue,
    });

    setIsModalOpen(true);
  };

  const handleDeleteClick = (expense) => {
    setPendingDeleteExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteExpense) return;

    const expenseId = pendingDeleteExpense._id || pendingDeleteExpense.id;
    if (!expenseId) {
      toast.error("Invalid expense ID");
      setIsDeleteOpen(false);
      setPendingDeleteExpense(null);
      return;
    }

    try {
      setDeletingExpenseId(expenseId);
      const res = await deleteExpense(expenseId);
      if (res?.success) {
        toast.success(res?.message || "Expense deleted successfully");
        await fetchExpenses(filters);
        setIsDeleteOpen(false);
        setPendingDeleteExpense(null);
      } else {
        toast.error(res?.message || "Failed to delete expense");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to delete expense");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  return (
    <div className="p-3 md:p-5 h-[calc(100vh-90px)] overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-5 gap-3">
        <h1 className="sub-header font-bold text-xl md:text-2xl">
          Expense Tracker
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap justify-end">
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
              className="border border-gray-300 px-3 md:px-4 py-2 rounded-md transition-all hover:bg-gray-100 font-semibold text-sm md:text-base"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 font-semibold text-sm md:text-base"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={() => fetchExpenses(filters)}
            className="bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 font-semibold text-sm md:text-base"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
                Total Expenses
              </h3>
              <p className="text-2xl md:text-[36px] font-futura text-primary break-words">
                {formatCurrency(calculateTotal())} MMK
              </p>
            </div>
            <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-primary opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
                Total Records
              </h3>
              <p className="text-2xl md:text-[36px] font-futura text-primary">
                {expenses.length}
              </p>
            </div>
            <FileText className="w-8 h-8 md:w-12 md:h-12 text-primary opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-3 md:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
                Average Expense
              </h3>
              <p className="text-2xl md:text-[36px] font-futura text-primary break-words">
                {expenses.length > 0
                  ? formatCurrency(
                      Math.round(calculateTotal() / expenses.length)
                    )
                  : "0"}{" "}
                MMK
              </p>
            </div>
            <TrendingUp className="w-8 h-8 md:w-12 md:h-12 text-primary opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                    className="px-4 lg:px-6 py-4 text-center text-gray-500"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 lg:px-6 py-4 text-center text-gray-500"
                  >
                    No expenses found. Add your first expense to get started.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.title || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {expense.description || "No description"}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-primary">
                        {formatCurrency(expense.expense || 0)} MMK
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        {formatDate(expense.manualDate || expense.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye size={16} className="lg:w-[18px] lg:h-[18px]" />
                          <span className="text-xs lg:text-sm hidden lg:inline">
                            View
                          </span>
                        </button>
                        <button
                          onClick={() => handleEditClick(expense)}
                          disabled={
                            isSubmitting || deletingExpenseId === expense._id
                          }
                          className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit Expense"
                        >
                          <Edit size={16} className="lg:w-[18px] lg:h-[18px]" />
                          <span className="text-xs lg:text-sm hidden lg:inline">
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense)}
                          disabled={deletingExpenseId === expense._id}
                          className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Expense"
                        >
                          {deletingExpenseId === expense._id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2
                              size={16}
                              className="lg:w-[18px] lg:h-[18px]"
                            />
                          )}
                          <span className="text-xs lg:text-sm hidden lg:inline">
                            Delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3 max-h-[calc(100vh-400px)] overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No expenses found. Add your first expense to get started.
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense._id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {expense.title || "N/A"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(expense.manualDate || expense.createdAt)}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(expense.expense || 0)} MMK
                    </p>
                  </div>
                </div>
                {expense.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {expense.description}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedExpense(expense);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 px-3 py-2 text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleEditClick(expense)}
                    disabled={isSubmitting || deletingExpenseId === expense._id}
                    className="flex-1 px-3 py-2 text-blue-500 border border-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(expense)}
                    disabled={deletingExpenseId === expense._id}
                    className="flex-1 px-3 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingExpenseId === expense._id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 md:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 md:p-5 border-b sticky top-0 bg-white">
              <h3 className="text-base md:text-lg font-bold">
                {editingExpenseId ? "Edit Expense" : "Add New Expense"}
              </h3>
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
              <div className="p-4 md:p-5 space-y-4">
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
                    <div className="absolute z-50 bottom-full mb-2 md:top-[-300px] md:bottom-auto md:mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 left-0 right-0 md:left-auto md:right-auto md:w-auto">
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
              <div className="border-t p-4 md:p-5 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors font-semibold disabled:opacity-50 text-sm md:text-base"
                >
                  {isSubmitting
                    ? editingExpenseId
                      ? "Updating..."
                      : "Adding..."
                    : editingExpenseId
                    ? "Update Expense"
                    : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {isDetailModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 md:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 md:p-5 border-b sticky top-0 bg-white">
              <h3 className="text-base md:text-lg font-bold">
                Expense Details
              </h3>
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
            <div className="p-4 md:p-5 space-y-4 md:space-y-6">
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
            <div className="border-t p-4 md:p-5 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedExpense(null);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors font-semibold text-sm md:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModel
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!deletingExpenseId) {
            setIsDeleteOpen(false);
            setPendingDeleteExpense(null);
          }
        }}
        submit={handleConfirmDelete}
        text={
          pendingDeleteExpense
            ? `Are you sure you want to delete the expense "${
                pendingDeleteExpense?.title || "this expense"
              }"? This action cannot be undone.`
            : "Are you sure you want to delete this expense?"
        }
      />
    </div>
  );
};

export default ExpenseTrackerPage;
