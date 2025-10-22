// import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./../hook/auth/AuthContext.jsx";
import { useEffect } from "react";

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("biz-bozz");
  // console.log(token);
  // const { isAuthenticated } = useAuth();
  // Get authentication state from context

  if (!token) {
    return useEffect(() => {
      navigate("/login");
    }, []);
  } else {
    return children;
  }
};

export default PrivateRoute;
