import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { Toaster } from "sonner";
import { AuthProvider } from "./hook/auth/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <Suspense>
    <AuthProvider>
      <Router>
        <Provider store={store}>
          <Toaster position="top-center" richColors />
          <App />
        </Provider>
      </Router>
    </AuthProvider>
  </Suspense>
);
