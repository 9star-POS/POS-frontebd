import { toast } from "sonner";
import axios from "../axios";

const deleteExpense = async (expenseId) => {
  const toastId = toast.loading("Deleting Expense...");
  try {
    const res = await axios.delete(`api/v1/expense-tracker/${expenseId}`);
    toast.success(res?.data?.message || "Expense deleted successfully!", {
      id: toastId,
      autoClose: 2000,
    });
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.message ||
        "There was an error deleting the expense!",
      {
        id: toastId,
        autoClose: 2000,
      }
    );
    return error?.response?.data || error;
  }
};

export default deleteExpense;

