import { createSlice } from "@reduxjs/toolkit";

const ktvReceiptSlice = createSlice({
  name: "ktvReceipts",
  initialState: {
    selectedRoom: null,
    receipts: {},
    orderIds: {}, // Track order IDs by room number
    roomDetails: {}, // Track metadata like roomId/status by room number
  },
  reducers: {
    selectRoom(state, action) {
      state.selectedRoom = action.payload;
    },
    setOrderIdForRoom(state, action) {
      const { room, orderId } = action.payload;
      state.orderIds[room] = orderId;
    },
    removeRoom(state, action) {
      const roomToRemove = action.payload;
      delete state.receipts[roomToRemove];
      delete state.orderIds[roomToRemove];
      delete state.roomDetails[roomToRemove];
      if (state.selectedRoom === roomToRemove) {
        state.selectedRoom = null;
      }
    },
    setRoomDetails(state, action) {
      const { room, roomId, status } = action.payload;
      if (!room) return;
      if (!state.roomDetails) {
        state.roomDetails = {};
      }
      state.roomDetails[room] = {
        ...(state.roomDetails[room] || {}),
        ...(roomId ? { roomId } : {}),
        ...(status ? { status } : {}),
      };
    },
    addItemToRoomReceipt(state, action) {
      const { room, item } = action.payload;
      if (!state.receipts[room]) {
        state.receipts[room] = {
          items: [],
          orderType: "KTV",
          vocalists: [],
          roomService: null,
        };
      }
      if (!Array.isArray(state.receipts[room].items)) {
        state.receipts[room].items = [];
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
        state.receipts[room] = {
          items: [],
          orderType: "KTV",
          vocalists: [],
          roomService: null,
        };
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
        state.receipts[room] = {
          items: [],
          orderType: "KTV",
          vocalists: [],
          roomService: null,
        };
      }
      state.receipts[room].vocalists = (vocalists || []).map((v) => ({
        vocalistId: v.vocalistId,
        vocalistName: v.vocalistName,
        hourlyRate: Number(v.hourlyRate) || 0,
        serviceTime: Number(v.serviceTime) || 0,
      }));
    },
    addVocalistToRoom(state, action) {
      const { room, vocalist } = action.payload;
      if (!state.receipts[room]) {
        state.receipts[room] = {
          items: [],
          orderType: "KTV",
          vocalists: [],
          roomService: null,
        };
      }
      if (!Array.isArray(state.receipts[room].vocalists)) {
        state.receipts[room].vocalists = [];
      }
      // Check if vocalist already exists
      const exists = state.receipts[room].vocalists.find(
        (v) => v.vocalistId === vocalist.vocalistId
      );
      if (!exists) {
        state.receipts[room].vocalists.push({
          vocalistId: vocalist.vocalistId,
          vocalistName: vocalist.vocalistName,
          hourlyRate: Number(vocalist.hourlyRate) || 0,
          serviceTime: Number(vocalist.serviceTime) || 0,
        });
      }
    },
    removeVocalistFromRoom(state, action) {
      const { room, vocalistId } = action.payload;
      if (state.receipts[room]?.vocalists) {
        state.receipts[room].vocalists = state.receipts[room].vocalists.filter(
          (v) => v.vocalistId !== vocalistId
        );
      }
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
      if (!state.receipts[room]) {
        state.receipts[room] = {
          items: [],
          orderType: "KTV",
          vocalists: [],
          roomService: null,
        };
      }
      state.receipts[room].items = items || [];
      if (orderType) {
        state.receipts[room].orderType = orderType;
      }
    },
    setRoomStatus(state, action) {
      const { room, status } = action.payload;
      if (!room || !status) return;
      if (!state.roomDetails) {
        state.roomDetails = {};
      }
      if (!state.roomDetails[room]) {
        state.roomDetails[room] = { status };
      } else {
        state.roomDetails[room].status = status;
      }
    },
  },
});

export const {
  selectRoom,
  setOrderIdForRoom,
  removeRoom,
  addItemToRoomReceipt,
  removeItemFromRoomReceipt,
  setRoomOrderType,
  setRoomServiceForRoom,
  incrementRoomServiceTime,
  decrementRoomServiceTime,
  setVocalistsForRoom,
  addVocalistToRoom,
  removeVocalistFromRoom,
  incrementVocalistServiceTime,
  decrementVocalistServiceTime,
  incrementRoomItemQuantity,
  decrementRoomItemQuantity,
  setItemsForRoom,
  setRoomDetails,
  setRoomStatus,
} = ktvReceiptSlice.actions;

export default ktvReceiptSlice.reducer;
