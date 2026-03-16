import { Navigate } from 'react-router-dom';

const RoleProtectedRoutes = ({children, allowedRoles}) => {
    const role = localStorage.getItem("role");
    if(!allowedRoles.includes("role")){
        return <Navigate to="/dashboard" />
    }
    return children;
}

export default RoleProtectedRoutes