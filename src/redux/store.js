import { configureStore } from "@reduxjs/toolkit";
import receiptReducer from "./receiptSlice";

const PERSIST_KEY = "receiptsState";

const loadState = () => {
  try {
    const serialized = localStorage.getItem(PERSIST_KEY);
    if (!serialized) return undefined;
    const parsed = JSON.parse(serialized);
    if (parsed && typeof parsed === "object") {
      return { receipts: parsed };
    }
  } catch (_) {
    // no-op
  }
  return undefined;
};

const store = configureStore({
  reducer: {
    receipts: receiptReducer,
  },
  preloadedState: loadState(),
});

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state.receipts));
  } catch (_) {
    // no-op
  }
});

export default store;
