import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import getExpenses from "../api/expense/getExpenses";
import addExpense from "../api/expense/addExpense";
import { format } from "date-fns";
import {
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  Plus,
  X,
} from "lucide-react";

const ExpenseTrackerPage = () => {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expense: "",
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await getExpenses();
      console.log("Expenses Response:", response);
      if (response.status === "success" || response.code === 200) {
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
    fetchExpenses();
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

    setIsSubmitting(true);
    try {
      const expenseData = {
        title: formData.title.trim(),
        description: formData.description.trim() || "",
        expense: parseFloat(formData.expense),
      };

      const response = await addExpense(expenseData);

      if (
        response.status === "success" ||
        response.code === 201 ||
        response.code === 200
      ) {
        toast.success("Expense added successfully");
        setIsModalOpen(false);
        setFormData({
          title: "",
          description: "",
          expense: "",
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
    setFormData({
      title: "",
      description: "",
      expense: "",
    });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-5">
        <h1 className="sub-header font-bold">Expense Tracker</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Expense
          </button>
          <button
            onClick={fetchExpenses}
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden pb-10">
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
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
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(expense.createdAt)}
                      </div>
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
    </div>
  );
};

export default ExpenseTrackerPage;
