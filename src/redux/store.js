import { configureStore } from "@reduxjs/toolkit";
import receiptReducer from "./receiptSlice";

const store = configureStore({
  reducer: {
    receipts: receiptReducer,
  },
});

export default store;
