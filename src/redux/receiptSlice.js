import { createSlice } from "@reduxjs/toolkit";

const receiptSlice = createSlice({
  name: "receipts",
  initialState: {
    selectedTable: null,
    receipts: {},
  },
  reducers: {
    selectTable(state, action) {
      state.selectedTable = action.payload;
    },
    removeTable(state, action) {
      const tableToRemove = action.payload;
      delete state.receipts[tableToRemove];
      if (state.selectedTable === tableToRemove) {
        state.selectedTable = null;
      }
    },
    addItemToReceipt(state, action) {
      const { table, item } = action.payload;
      if (!state.receipts[table]) {
        state.receipts[table] = { items: [], orderType: "Dine In" };
      }
      state.receipts[table].items.push(item);
    },
    removeItemFromReceipt(state, action) {
      const { table, itemName } = action.payload;
      if (state.receipts[table]) {
        const index = state.receipts[table].items.findIndex(
          (item) => item.dishName === itemName
        );
        if (index !== -1) {
          state.receipts[table].items.splice(index, 1); // Remove one instance of the item
        }
      }
    },
    setOrderType(state, action) {
      const { table, orderType } = action.payload;
      if (!state.receipts[table]) {
        state.receipts[table] = { items: [], orderType: orderType }; // Initialize if not present
      } else {
        state.receipts[table].orderType = orderType; // Update order type for the specific table
      }
    },
  },
});

export const {
  selectTable,
  removeTable,
  addItemToReceipt,
  removeItemFromReceipt,
  setOrderType,
} = receiptSlice.actions;
export default receiptSlice.reducer;
