import { toast } from "sonner";
import axios from "../axios";

const updateExpense = async (expenseId, data) => {
  const toastId = toast.loading("Updating Expense...");
  try {
    const res = await axios.put(`api/v1/expense-tracker/${expenseId}`, data);
    toast.success(res?.data?.message || "Expense updated successfully!", {
      id: toastId,
      autoClose: 2000,
    });
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.message ||
        "There was an error updating the expense!",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default updateExpense;

