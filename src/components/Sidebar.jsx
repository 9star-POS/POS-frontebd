// import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Menu,
  Receipt,
  ChefHat,
  Music,
  BarChart,
  Wallet,
  Users,
  Wine,
  Bell,
  CreditCard,
} from "lucide-react";

const Sidebar = ({ closeSidebar }) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const userData = localStorage.getItem("bz-user");
      if (userData) {
        const user = JSON.parse(userData);
        return user?.role || null;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
    return null;
  };

  const userRole = getUserRole();
  const isCashier = userRole === "cashier";
  const isKtvWaiter = userRole === "ktv-waiter";
  const isRestaurantWaiter = userRole === "restaurant-waiter";

  const allNavItems = [
    { to: "/", icon: Home, label: "Restaurant" },
    { to: "/ktv", icon: Music, label: "KTV" },
    { to: "/menu", icon: Menu, label: "Menu" },
    { to: "/orders", icon: Receipt, label: "Orders" },
    { to: "/kitchen", icon: ChefHat, label: "Kitchen" },
    { to: "/bar", icon: Wine, label: "Bar" },
    { to: "/sales-report", icon: BarChart, label: "Sales Report" },
    { to: "/expense-tracker", icon: Wallet, label: "Expense Tracker" },
    { to: "/debt-tracker", icon: CreditCard, label: "Debt Tracker" },
    { to: "/notifications", icon: Bell, label: "Notifications" },
    { to: "/accounts", icon: Users, label: "Accounts" },
  ];

  // Filter nav items based on role
  let navItems;
  if (isKtvWaiter) {
    // KTV waiter - only show KTV
    navItems = allNavItems.filter((item) => item.to === "/ktv");
  } else if (isRestaurantWaiter) {
    // Restaurant waiter - only show Restaurant
    navItems = allNavItems.filter((item) => item.to === "/");
  } else if (isCashier) {
    // Cashier - show all except Accounts
    navItems = allNavItems.filter((item) => item.to !== "/accounts");
  } else {
    // Other roles - show all
    navItems = allNavItems;
  }

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
