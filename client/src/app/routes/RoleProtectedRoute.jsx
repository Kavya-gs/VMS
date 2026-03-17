import { Navigate, useLocation } from "react-router-dom";

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const role = localStorage.getItem("role");
  const location = useLocation();

  console.log("ROLE:", role);
  console.log("ALLOWED:", allowedRoles);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // 🚨 prevent loop
    if (location.pathname === "/dashboard") {
      return <div>Unauthorized</div>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleProtectedRoute;