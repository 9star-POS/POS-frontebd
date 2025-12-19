import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import { Route, Routes } from "react-router-dom";
import OrderPage from "./pages/OrderPage";
import OrderDetail from "./pages/OrderDetail";
import KtvOrderDetail from "./pages/KtvOrderDetail";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import PageNotFound from "./components/PageNotFound";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import { Receipt as ReceiptIcon } from "lucide-react";
import { IoMdMenu } from "react-icons/io";
import Sidebar from "./components/Sidebar";
import SalesReportPage from "./pages/SalesReportPage";
import ExpenseTrackerPage from "./pages/ExpenseTrackerPage";
import NotificationPage from "./pages/NotificationPage";
import AccountManagementPage from "./pages/AccountManagementPage";
import DebtPage from "./pages/DebtPage";
import VocalistPage from "./pages/VocalistPage";
import { NotificationProvider } from "./contexts/NotificationContext";

import "./App.css";
import EnterID from "./pages/EnterID";
import User from "./components/User";
import { useSelector } from "react-redux";
import SetupShop from "./pages/SetupShop";
import Welcome from "./pages/Welcome";
import TablePage from "./components/Home/TablePage";
import KTVPage from "./pages/KTVPage";
import RoomPage from "./components/KTV/RoomPage";
import KitchenPage from "./pages/KitchenPage";
import BarPage from "./pages/BarPage";

export default function App() {
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const location = window.location.pathname;
  const user = JSON.parse(localStorage.getItem("bz-user"));
  const [islogin, setIslogin] = useState(false);
  const [isVisible, setisVisible] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  useEffect(() => {
    if (
      location.includes("/login") ||
      location.includes("/signup") ||
      location.includes("/setup") ||
      location.includes("/welcome")
    ) {
      setIslogin(false);
    } else {
      setIslogin(true);
    }
  }, [location]);

  useEffect(() => {
    if (receipts[selectedTable]?.items.length > 0) {
      setAnimate(true);
      const timeout = setTimeout(() => {
        setAnimate(false); // Reset animation class after it finishes
      }, 300); // Match this duration with the CSS animation duration

      return () => clearTimeout(timeout);
    }
  }, [receipts[selectedTable]?.items.length]);

  return (
    <NotificationProvider>
      <AnimatePresence>
        <div className="bg-gray-100 h-screen">
          <div className="flex flex-col">
            {/* Button to open/close the sidebar */}
            {islogin && (
              <div className="px-4 md:px-5 mt-3 md:mt-2 flex justify-between">
                <button
                  onClick={toggleSidebar}
                  className="p-3 border bg-white border-gray-300 text-primary rounded-lg focus:outline-none"
                >
                  <IoMdMenu size={30} />
                </button>

                <div className="flex items-center gap-2">
                  <User user={user} />
                </div>
                {/* <button
                type="button"
                className="relative md:hidden inline-flex items-center p-3 text-sm font-medium text-center text-white bg-primary rounded-lg"
                onClick={() => setisVisible(!isVisible)}
              >
                <ReceiptIcon size={25} />
                {receipts[selectedTable]?.items.length > 0 && (
                  <div
                    className={`absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-primary bg-white border-2 border-white rounded-full -top-2 -right-2 ${
                      animate ? "badge-animate" : ""
                    }`}
                  >
                    {receipts[selectedTable]?.items.length}
                  </div>
                )}
              </button> */}
              </div>
            )}

            {/* Sidebar Component */}

            <div
              className={`${
                islogin
                  ? "flex-1 bg-white border border-gray-300 mx-1 md:mx-5 mt-2 rounded-xl shadow-md overflow-hidden"
                  : ""
              }`}
            >
              {isSidebarVisible && (
                <div
                  className="fixed inset-0 z-20 flex items-start"
                  onClick={toggleSidebar}
                >
                  <div className="absolute inset-0 bg-black/25" />
                  <div
                    className="relative z-30 w-64 bg-white rounded-lg shadow-xl border border-gray-200 max-w-md p-5 m-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Sidebar closeSidebar={toggleSidebar} />
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className={`flex-1 ${islogin ? "pt-1" : ""}`}>
                <div className="flex">
                  {/* Main Content Area */}
                  <div className="flex-1">
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />

                      <Route
                        path="/"
                        element={
                          <PrivateRoute>
                            <TablePage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/:table"
                        element={
                          <PrivateRoute>
                            <HomePage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/ktv"
                        element={
                          <PrivateRoute>
                            <RoomPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/ktv/:room"
                        element={
                          <PrivateRoute>
                            <KTVPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/sales-report"
                        element={
                          <PrivateRoute>
                            <SalesReportPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/expense-tracker"
                        element={
                          <PrivateRoute>
                            <ExpenseTrackerPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <PrivateRoute>
                            <NotificationPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/accounts"
                        element={
                          <PrivateRoute>
                            <AccountManagementPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/debt-tracker"
                        element={
                          <PrivateRoute>
                            <DebtPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/vocalists"
                        element={
                          <PrivateRoute>
                            <VocalistPage />
                          </PrivateRoute>
                        }
                      />
                      <Route path="/signup" element={<EnterID />} />
                      <Route path="/welcome" element={<Welcome />} />
                      <Route path="/setup" element={<SetupShop />} />
                      <Route
                        path="/menu"
                        element={
                          <PrivateRoute>
                            <MenuPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/dashboard"
                        element={
                          <PrivateRoute>
                            <Dashboard />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <PrivateRoute>
                            <OrderPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/orders/:id"
                        element={
                          <PrivateRoute>
                            <OrderDetail />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/ktv-orders/:id"
                        element={
                          <PrivateRoute>
                            <KtvOrderDetail />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/kitchen"
                        element={
                          <PrivateRoute>
                            <KitchenPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/bar"
                        element={
                          <PrivateRoute>
                            <BarPage />
                          </PrivateRoute>
                        }
                      />

                      <Route path="*" element={<PageNotFound />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatePresence>
    </NotificationProvider>
  );
}
