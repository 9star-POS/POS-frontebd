import { useState, useEffect, useRef } from "react";
import { FaUser } from "react-icons/fa";
import { GoSignOut } from "react-icons/go";
// import { useAuth } from "../hook/auth/AuthContext";

const User = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const id = localStorage.getItem("biz-bozz-id");
  // const { logout } = useAuth();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    window.location.href = `/login`;
    localStorage.removeItem("biz-bozz-token");
    localStorage.removeItem("bz-user");
    // logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="User menu"
      >
        <FaUser size={20} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-in-out opacity-100 translate-y-0">
          {/* Username Section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-500">Signed in as</p>
            <p className="text-base font-bold text-primary mt-1 truncate">
              {user?.name || "User"}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleClose}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
          >
            <GoSignOut size={20} />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default User;
