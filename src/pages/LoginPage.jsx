import { useState } from "react";
import EyeToggle from "../components/EyeToggle";
import handleSignIn from "../api/auth/signIn";
import { Link, useParams } from "react-router-dom";
import logo from "./../assets/lgoo.png";
// import { useAuth } from "../hook/auth/AuthContext";

const LoginPage = () => {
  const { id } = useParams();
  // const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  // const [formData, setFormData] = useState({});

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible); // Toggle password visibility
  };

  const handleLogin = async (formData) => {
    const res = await handleSignIn({ formData, id });
    if (res.success) {
      const user = {
        name: res.data.admin.name,
        role: res.data.admin.role,
      };
      localStorage.setItem("bz-user", JSON.stringify(user));
      localStorage.setItem("biz-bozz-token", res.data.token);

      // Redirect based on user role
      if (user.role === "kitchen") {
        window.location.href = "/kitchen";
      } else if (user.role === "bar-counter") {
        window.location.href = "/bar";
      } else if (user.role === "ktv-waiter") {
        window.location.href = "/ktv";
      } else {
        window.location.href = "/";
      }
    }
  };

  // console.log(formData);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name: name,
      password,
    };
    handleLogin(formData);
  };

  return (
    <div className="flex w-full justify-center items-center mt-20 md:mt-0 h-screen">
      <div className="absolute top-0 left-0">
        <img src={logo} alt="logo" className="w-20 h-20" />
      </div>
      <div className="w-full mx-0 md:w-[450px] mdshadow-md rounded-lg p-6 border border-gray-100">
        <h2 className="sub-header font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className="block w-full px-3 py-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="mb-4 relative">
            <label className="block text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type={isPasswordVisible ? "text" : "password"} // Toggle input type
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password or pin"
              required
              className="block w-full px-3 py-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {/* Use the reusable EyeToggle component */}
            <div className="absolute top-[55%] justify-center right-3 flex items-center">
              <EyeToggle onToggle={togglePasswordVisibility} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary mt-5 text-white font-bold py-4 rounded hover:bg-blue-600 transition duration-200"
          >
            Login
          </button>
        </form>
        {/* <div className="border-b border-gray-500 mt-5"></div>
        <h2 className="sub-header font-bold mt-5">Don't Have Account?</h2>
        <Link
          to="/signup"
          className="w-full block text-center mt-4 bg-prilight border border-primary text-primary font-bold py-4 rounded hover:bg-pridark transition duration-200"
        >
          Sign Up Biz Bozz
        </Link> */}
      </div>
    </div>
  );
};

export default LoginPage;
