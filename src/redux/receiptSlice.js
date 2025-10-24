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
        (i) => i.name === item.name
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
          (item) => item.name === itemName
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
          (item) => item.name === itemName
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
          (item) => item.name === itemName
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
    setItemsForTable(state, action) {
      const { table, items, orderType } = action.payload;
      state.receipts[table] = {
        items: items || [],
        orderType: orderType || state.receipts[table]?.orderType || "Dine In",
      };
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
  setItemsForTable,
} = receiptSlice.actions;
export default receiptSlice.reducer;
