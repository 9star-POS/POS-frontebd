import { configureStore } from "@reduxjs/toolkit";
import receiptReducer from "./receiptSlice";
import ktvReceiptReducer from "./ktvReceiptSlice";

const PERSIST_KEY = "receiptsState";
const KTV_PERSIST_KEY = "ktvReceiptsState";

const loadState = () => {
  try {
    const receiptsSerialized = localStorage.getItem(PERSIST_KEY);
    const ktvSerialized = localStorage.getItem(KTV_PERSIST_KEY);
    const receiptsParsed = receiptsSerialized
      ? JSON.parse(receiptsSerialized)
      : undefined;
    const ktvParsed = ktvSerialized ? JSON.parse(ktvSerialized) : undefined;
    const preloaded = {};
    if (receiptsParsed && typeof receiptsParsed === "object") {
      preloaded.receipts = receiptsParsed;
    }
    if (ktvParsed && typeof ktvParsed === "object") {
      preloaded.ktvReceipts = ktvParsed;
    }
    return Object.keys(preloaded).length ? preloaded : undefined;
  } catch (_) {
    // no-op
  }
  return undefined;
};

const store = configureStore({
  reducer: {
    receipts: receiptReducer,
    ktvReceipts: ktvReceiptReducer,
  },
  preloadedState: loadState(),
});

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state.receipts));
    localStorage.setItem(KTV_PERSIST_KEY, JSON.stringify(state.ktvReceipts));
  } catch (_) {
    // no-op
  }
});

export default store;
