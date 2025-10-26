import { createSlice } from "@reduxjs/toolkit";

const ktvReceiptSlice = createSlice({
  name: "ktvReceipts",
  initialState: {
    selectedRoom: null,
    receipts: {},
  },
  reducers: {
    selectRoom(state, action) {
      state.selectedRoom = action.payload;
    },
    removeRoom(state, action) {
      const roomToRemove = action.payload;
      delete state.receipts[roomToRemove];
      if (state.selectedRoom === roomToRemove) {
        state.selectedRoom = null;
      }
    },
    addItemToRoomReceipt(state, action) {
      const { room, item } = action.payload;
      if (!state.receipts[room]) {
        state.receipts[room] = { items: [], orderType: "KTV" };
      }
      const existingItem = state.receipts[room].items.find(
        (i) => i.name === item.name
      );
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        state.receipts[room].items.push({ ...item, quantity: 1 });
      }
    },
    setRoomServiceForRoom(state, action) {
      const { room, hourlyRate, serviceTime } = action.payload;
      if (!state.receipts[room]) {
        state.receipts[room] = { items: [], orderType: "KTV" };
      }
      state.receipts[room].roomService = {
        hourlyRate: Number(hourlyRate) || 0,
        serviceTime: Number(serviceTime) || 0,
      };
    },
    incrementRoomServiceTime(state, action) {
      const { room, step = 0.5 } = action.payload;
      const roomData = state.receipts[room]?.roomService;
      if (!roomData) return;
      roomData.serviceTime = Number((roomData.serviceTime + step).toFixed(2));
    },
    decrementRoomServiceTime(state, action) {
      const { room, step = 0.5 } = action.payload;
      const roomData = state.receipts[room]?.roomService;
      if (!roomData) return;
      const next = roomData.serviceTime - step;
      roomData.serviceTime = Number((next < 0 ? 0 : next).toFixed(2));
    },
    setVocalistsForRoom(state, action) {
      const { room, vocalists } = action.payload;
      if (!state.receipts[room]) {
        state.receipts[room] = { items: [], orderType: "KTV" };
      }
      state.receipts[room].vocalists = (vocalists || []).map((v) => ({
        vocalistId: v.vocalistId,
        vocalistName: v.vocalistName,
        hourlyRate: Number(v.hourlyRate) || 0,
        serviceTime: Number(v.serviceTime) || 0,
      }));
    },
    incrementVocalistServiceTime(state, action) {
      const { room, vocalistId, step = 0.5 } = action.payload;
      const list = state.receipts[room]?.vocalists;
      if (!Array.isArray(list)) return;
      const found = list.find((v) => v.vocalistId === vocalistId);
      if (!found) return;
      found.serviceTime = Number((found.serviceTime + step).toFixed(2));
    },
    decrementVocalistServiceTime(state, action) {
      const { room, vocalistId, step = 0.5 } = action.payload;
      const list = state.receipts[room]?.vocalists;
      if (!Array.isArray(list)) return;
      const found = list.find((v) => v.vocalistId === vocalistId);
      if (!found) return;
      const next = found.serviceTime - step;
      found.serviceTime = Number((next < 0 ? 0 : next).toFixed(2));
    },
    removeItemFromRoomReceipt(state, action) {
      const { room, itemName } = action.payload;
      if (state.receipts[room]) {
        const index = state.receipts[room].items.findIndex(
          (item) => item.name === itemName
        );
        if (index !== -1) {
          state.receipts[room].items.splice(index, 1);
        }
      }
    },
    setRoomOrderType(state, action) {
      const { room, orderType } = action.payload;
      if (!state.receipts[room]) {
        state.receipts[room] = { items: [], orderType };
      } else {
        state.receipts[room].orderType = orderType;
      }
    },
    incrementRoomItemQuantity(state, action) {
      const { room, itemName } = action.payload;
      if (state.receipts[room]) {
        const item = state.receipts[room].items.find(
          (item) => item.name === itemName
        );
        if (item) {
          item.quantity = (item.quantity || 1) + 1;
        }
      }
    },
    decrementRoomItemQuantity(state, action) {
      const { room, itemName } = action.payload;
      if (state.receipts[room]) {
        const itemIndex = state.receipts[room].items.findIndex(
          (item) => item.name === itemName
        );
        if (itemIndex !== -1) {
          const item = state.receipts[room].items[itemIndex];
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            state.receipts[room].items.splice(itemIndex, 1);
          }
        }
      }
    },
    setItemsForRoom(state, action) {
      const { room, items, orderType } = action.payload;
      state.receipts[room] = {
        items: items || [],
        orderType: orderType || state.receipts[room]?.orderType || "KTV",
      };
    },
  },
});

export const {
  selectRoom,
  removeRoom,
  addItemToRoomReceipt,
  removeItemFromRoomReceipt,
  setRoomOrderType,
  setRoomServiceForRoom,
  incrementRoomServiceTime,
  decrementRoomServiceTime,
  setVocalistsForRoom,
  incrementVocalistServiceTime,
  decrementVocalistServiceTime,
  incrementRoomItemQuantity,
  decrementRoomItemQuantity,
  setItemsForRoom,
} = ktvReceiptSlice.actions;

export default ktvReceiptSlice.reducer;
