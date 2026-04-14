import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;