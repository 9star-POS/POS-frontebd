import { useState } from "react";
import { FaUser } from "react-icons/fa";
import { GoSignOut } from "react-icons/go";
// import { useAuth } from "../hook/auth/AuthContext";

const User = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative w-48 h-20 flex items-center">
      <div
        className={`cursor-pointer transition duration-300 absolute border border-primary rounded-full bg-white flex items-center gap-4 px-4 py-2 z-10 hover:scale-105 ${
          isOpen ? "-translate-x-[80px]" : "translate-x-0"
        }`}
        onClick={toggleDropdown}
      >
        <div className="text-primary border border-primary rounded-full p-2">
          <FaUser size={20} />
        </div>
        <div>
          <p className="font-bold text-primary">{user?.name}</p>
        </div>
      </div>
      <div
        className="absolute left-20 flex text-primary rounded border border-primary items-center cursor-pointer bg-white hover:text-orange-700"
        onClick={handleClose}
      >
        <GoSignOut size={25} />
        <p className="bg-white  font-futura text-xl font-semibold rounded-md px-4 py-2">
          Logout
        </p>
      </div>
      {/* <button
        onClick={toggleDropdown}
        className={`cursor-pointer absolute top-0 right-0 left-0 z-20 flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-md ${
          isOpen ? "bg-red-500" : "bg-red-50"
        } `}
      >
        <div className="text-primary border border-primary rounded-full p-2">
          <FaUser size={20} />
        </div>
        <div>
          <p className="font-bold text-primary">{user?.name}</p>
        </div>
      </button> */}

      {/* Dropdown menu */}
      {/* <button
        onClick={handleClose}
        className={`absolute right-0 z-10 top-0 w-[162px] py-4 rounded-md shadow-lg flex justify-center items-center gap-2`}
      >
        <GoSignOut size={25} className="text-primary" />
        <p className="bg-white text-primary font-futura text-xl font-semibold rounded-md px-4 py-2">
          Logout
        </p>
      </button> */}
    </div>
  );
};

export default User;
