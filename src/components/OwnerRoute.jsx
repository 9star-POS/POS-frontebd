import { Navigate } from "react-router-dom";
import { isOwner } from "../utils/getUserRole";

const OwnerRoute = ({ children }) => {
  if (!isOwner()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OwnerRoute;
