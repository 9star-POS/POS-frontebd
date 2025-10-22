import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./../assets/lgoo.png";
import { FaShop } from "react-icons/fa6";
import { CiLocationOn } from "react-icons/ci";

function SetupShop() {
  const navigate = useNavigate();
  const [id, setId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/login/${id}`);
  };

  return (
    <div className="flex w-full h-screen justify-center items-center overflow-y-auto relative">
      <div className="absolute top-0 left-0">
        <img src={logo} alt="logo" className="w-20 h-20" />
      </div>
      <div className="w-full md:w-[450px] px-10 lg:pb-10 bg-white shadow-md rounded-2xl border-2 border-gray-200">
        <h2 className="sub-header font-bold my-4">Create Your Shop</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="id" className="block mb-1 font-bold">
              Shop Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter your Shop Name"
                required
                className="block w-full py-3 ps-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <FaShop className="absolute text-gray-400 top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="id" className="block mb-1 font-bold">
              Shop Type
            </label>
            <select
              id="large"
              className="block w-full bg-white px-4 py-3 text-gray-500 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option selected>
                <p>Select Shop Type</p>
              </option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
            </select>
          </div>

          {/* <div className="mb-4">
            <label htmlFor="id" className="block mb-1 font-bold">
              Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter your Shop Address"
                required
                className="block w-full py-3 px-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <FaShop className="absolute text-gray-400 top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div> */}

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-4 rounded hover:bg-blue-600 transition duration-200"
          >
            Sign Up to Create Shop
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetupShop;
