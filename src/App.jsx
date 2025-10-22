import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import { Route, Routes } from "react-router-dom";
import OrderPage from "./pages/OrderPage";
import LoginPage from "./pages/LoginPage";
// import { useAuth } from "./hook/auth/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import PageNotFound from "./components/PageNotFound";
import { useEffect, useState } from "react";
import { IoMdMenu } from "react-icons/io";
import Scoreboard from "./pages/TestingPage";
import { Receipt } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard";
// import { FaUser } from "react-icons/fa";

import "./App.css";
import EnterID from "./pages/EnterID";
import User from "./components/User";
import { useSelector } from "react-redux";

export default function App() {
  // const dispatch = useDispatch();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  // console.log("app.js", receipts[selectedTable].items.length);
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
    if (location.includes("/login")) {
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
    <AnimatePresence>
      <div className="bg-gray-100">
        <div className="flex flex-col">
          {/* Button to open/close the sidebar */}
          {islogin && (
            <div className="px-4 md:px-5 mt-3 md:mt-2 flex justify-between">
              <button
                onClick={toggleSidebar}
                className="px-5 border bg-white border-gary-300 text-primary rounded-lg focus:outline-none"
              >
                <IoMdMenu size={30} />
              </button>

              <div className="">
                <User user={user} />
              </div>
              <button
                type="button"
                className="relative md:hidden inline-flex items-center p-3 text-sm font-medium text-center text-white bg-primary rounded-lg"
                onClick={() => setisVisible(!isVisible)}
              >
                <Receipt size={25} />
                {receipts[selectedTable]?.items.length > 0 && (
                  <div
                    className={`absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-primary bg-white border-2 border-white rounded-full -top-2 -right-2 ${
                      animate ? "badge-animate" : ""
                    }`}
                  >
                    {receipts[selectedTable]?.items.length}
                  </div>
                )}
              </button>
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
              <div className="fixed z-10 w-64 bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-5">
                  <Sidebar closeSidebar={toggleSidebar} />
                </div>
              </div>
            )}

            <Routes>
              <Route path="/login/:id" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  // <PrivateRoute>
                  <HomePage isVisible={isVisible} />
                  // </PrivateRoute>
                }
              />
              <Route
                path="/login"
                element={
                  // <PrivateRoute>
                  <EnterID />
                  // </PrivateRoute>
                }
              />
              <Route
                path="/menu"
                element={
                  // <PrivateRoute>
                  <MenuPage />
                  // </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  // <PrivateRoute>
                  <Dashboard />
                  // </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  // <PrivateRoute>
                  <OrderPage />
                  // </PrivateRoute>
                }
              />
              <Route
                path="/testing"
                element={
                  <PrivateRoute>
                    <Scoreboard />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
