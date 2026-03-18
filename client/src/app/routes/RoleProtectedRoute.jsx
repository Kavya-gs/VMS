import { Navigate, useLocation } from "react-router-dom";

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (location.pathname === "/dashboard") {
      return <div>Unauthorized</div>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleProtectedRoute;