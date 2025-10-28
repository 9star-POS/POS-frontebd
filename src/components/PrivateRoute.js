import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("biz-bozz-token");

  // If no token, redirect to login
  if (!token) {
    return (window.location.href = "/login");
  }

  // If token exists, render the protected component
  return children;
};

export default PrivateRoute;
