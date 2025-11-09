// import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Menu,
  Receipt,
  ChefHat,
  LogOut,
  ChevronLeft,
  Music,
  BarChart,
  Wallet,
  Bell,
} from "lucide-react";
import { useAuth } from "../hook/auth/AuthContext";

const Sidebar = ({ closeSidebar }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { to: "/", icon: Home, label: "Restaurant" },
    { to: "/ktv", icon: Music, label: "KTV" },
    { to: "/menu", icon: Menu, label: "Menu" },
    { to: "/orders", icon: Receipt, label: "Orders" },
    { to: "/kitchen", icon: ChefHat, label: "Kitchen" },
    { to: "/sales-report", icon: BarChart, label: "Sales Report" },
    { to: "/expense-tracker", icon: Wallet, label: "Expense Tracker" },
    { to: "/notifications", icon: Bell, label: "Notifications" },
  ];

  const isNavActive = (navTo) => {
    if (navTo === "/") {
      if (pathname === "/") return true;
      if (pathname.startsWith("/order/")) return true;
      if (/^\/\d+/.test(pathname)) return true;
      return false;
    }
    return pathname === navTo || pathname.startsWith(`${navTo}/`);
  };

  return (
    <div>
      {navItems.map((nav, index) => (
        <NavLink
          key={index}
          to={nav.to}
          className={`flex items-center p-2 my-2 rounded-lg transition-colors hover:bg-gray-100 ${
            isNavActive(nav.to) ? "text-primary bg-prilight" : "text-gray-500"
          }`}
          onClick={closeSidebar}
        >
          {/* <nav.icon className="w-6 h-6" /> */}
          <span className="ml-2 font-bold text-lg">{nav.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
