// import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Menu, Receipt, LogOut, ChevronLeft } from "lucide-react";
import { useAuth } from "../hook/auth/AuthContext";

const Sidebar = ({ closeSidebar }) => {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/menu", icon: Menu, label: "Menu" },
    { to: "/orders", icon: Receipt, label: "Orders" },
    // { to: "/dashboard", icon: Receipt, label: "Reports" },
  ];

  return (
    <div>
      {navItems.map((nav, index) => {
        return (
          <NavLink
            key={index}
            to={nav.to}
            className={({ isActive }) =>
              isActive ? "text-primary" : "text-gray-500"
            }
            onClick={closeSidebar}
          >
            <div className="flex items-center p-2 my-2 rounded-lg hover:bg-gray-100">
              {/* <nav.icon className="w-6 h-6" /> */}
              <span className="ml-2 font-bold text-lg">{nav.label}</span>
            </div>
          </NavLink>
        );
      })}
    </div>
  );
};

export default Sidebar;
