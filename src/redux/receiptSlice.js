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
      const existingItem = state.receipts[table].items.find(
        (i) => i.dishName === item.dishName
      );
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        state.receipts[table].items.push({ ...item, quantity: 1 });
      }
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
    incrementQuantity(state, action) {
      const { table, itemName } = action.payload;
      if (state.receipts[table]) {
        const item = state.receipts[table].items.find(
          (item) => item.dishName === itemName
        );
        if (item) {
          item.quantity = (item.quantity || 1) + 1;
        }
      }
    },
    decrementQuantity(state, action) {
      const { table, itemName } = action.payload;
      if (state.receipts[table]) {
        const itemIndex = state.receipts[table].items.findIndex(
          (item) => item.dishName === itemName
        );
        if (itemIndex !== -1) {
          const item = state.receipts[table].items[itemIndex];
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            // Remove the item when quantity reaches 0
            state.receipts[table].items.splice(itemIndex, 1);
          }
        }
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
  incrementQuantity,
  decrementQuantity,
} = receiptSlice.actions;
export default receiptSlice.reducer;
