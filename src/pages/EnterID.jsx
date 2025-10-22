import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./../assets/lgoo.png";
import { FaShop } from "react-icons/fa6";
import handleSignUp from "../api/auth/signup";
import EyeToggle from "../components/EyeToggle";
import { MdArrowBack } from "react-icons/md";

function EnterID() {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState("");
  const [showdrop, setShowDrop] = useState(false);
  const [shopType, setShopType] = useState("Select Your Shop Type");
  const [phone_number, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(true);
  const [error, setError] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const validatePhoneNumber = (number) => {
    // Basic regex pattern for a 10-digit phone number (e.g., 123-456-7890, (123) 456-7890, 1234567890
    const phonePattern = /^(?:\+95|095|09)?\d{7,10}$/;
    return phonePattern.test(number);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible); // Toggle password visibility
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShow(false);
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const data = {
      shopName,
      shopType,
      phone_number,
      password,
      confirmPassword,
    };
    const res = await handleSignUp(data);
    console.log("res", res);
    if (res.statusCode === 201) {
      const user = {
        name: res.data.user.shopName,
        role: res.data.user.role,
      };
      localStorage.setItem("bz-user", JSON.stringify(user));
      localStorage.setItem("biz-bozz-token", res.data.token);
      navigate("/welcome");
    }
  };

  return (
    <div className="flex w-full h-screen  justify-center overflow-y-auto relative">
      <div className="absolute top-0 left-0">
        <img src={logo} alt="logo" className="w-20 h-20" />
      </div>
      {show ? (
        <div className="w-full mx-3 md:w-[450px] mt-20 bg-white md:shadow-md md:rounded-lg py-6 md:border border-gray-100">
          <div className="flex flex-col h-auto justify-center">
            <h2 className="sub-header font-bold mb-4">Sign Up For Free</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="id" className="block mb-1 font-bold">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  value={phone_number}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (validatePhoneNumber(e.target.value)) {
                      setError(false);
                    } else {
                      setError(true);
                    }
                  }}
                  placeholder="Enter your Phone Number"
                  required
                  className={`block w-full px-2 py-4 rounded border focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    error ? "border-red-500" : "border border-gray-300"
                  }`}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">
                    Invalid phone number format. Please enter a valid phone
                    number.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="id" className="block mb-1 font-bold">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={isPasswordVisible ? "text" : "password"} // Toggle input type
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your Password"
                    required
                    className={`block w-full px-2 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                      password.length < 6 ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {/* Use the reusable EyeToggle component */}
                  <div className="absolute bottom-1 right-3 transform -translate-y-1/2 cursor-pointer">
                    <EyeToggle onToggle={togglePasswordVisibility} />
                  </div>
                </div>
                {password.length < 6 && (
                  <p className="text-red-500 text-sm mt-1">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <div className="mb-4 relative">
                <label htmlFor="id" className="block mb-1 font-bold">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={isPasswordVisible ? "text" : "password"} // Toggle input type
                    id="password"
                    name="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Pls re-enter password"
                    required
                    className={`block w-full px-2 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                      password !== confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {/* Use the reusable EyeToggle component */}
                  <div className="absolute bottom-4 right-3 cursor-pointer">
                    <EyeToggle onToggle={togglePasswordVisibility} />
                  </div>
                </div>
                {password !== confirmPassword && (
                  <p className="text-red-500 text-end text-sm">
                    Your password doesn't match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={password !== confirmPassword}
                className="w-full bg-primary mt-5 text-white font-bold py-6 rounded hover:bg-pridark transition duration-200"
              >
                Sign Up to Create Shop
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="w-full mx-3 mt-20 md:w-[450px] bg-white md:shadow-md rounded-lg py-6 md:border border-gray-100">
          <div className="flex gap-2 items-center">
            <MdArrowBack onClick={() => setShow(true)} size={30} />
            <h2 className="sub-header font-bold my-4">Create Your Shop</h2>
          </div>
          <form onSubmit={handleClick}>
            <div className="mb-4">
              <label htmlFor="id" className="block mb-3 font-bold">
                Shop Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Enter your Shop Name"
                  required
                  className="block w-full py-4 ps-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <FaShop className="absolute text-gray-400 top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="id" className="block mb-3 font-bold">
                Shop Type
              </label>

              <button
                onClick={() => setShowDrop(!showdrop)}
                id="dropdownDefaultButton"
                data-dropdown-toggle="dropdown"
                className="w-full flex justify-between text-primary py-4 bg-white border border-gray-300 focus:ring-2 focus:outline-none focus:ring-gray-500 font-medium rounded-lg px-5 text-center inline-flex items-center"
                type="button"
              >
                {shopType}
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>

              {/* <!-- Dropdown menu --> */}
              {showdrop && (
                <div
                  id="dropdown"
                  className="w-full z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm"
                >
                  <ul
                    className="w-full py-2 "
                    aria-labelledby="dropdownDefaultButton"
                  >
                    <li className="w-full">
                      <button
                        onClick={() => {
                          setShopType("Restaurant");
                          setShowDrop(false);
                        }}
                        className="w-full block px-4 py-2"
                      >
                        Restaurant
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-5 bg-primary text-white font-bold py-6 rounded-lg hover:bg-prdark transition duration-200"
            >
              Get Started
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default EnterID;
