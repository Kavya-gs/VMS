import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <div>Unauthorized</div>;
  }

  return children;
};

export default RoleProtectedRoute;