import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in (adjust based on how you store auth state)
  const token = localStorage.getItem("token"); // or sessionStorage, or your auth context
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
