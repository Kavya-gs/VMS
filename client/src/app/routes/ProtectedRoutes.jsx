import { Navigate } from 'react-router-dom';

const ProtectedRoutes = ({children}) => {

    const token = localStorage.getItem("token");
    if(!token){
        return <Navigate to="/login"/>
    }
    else{
        return children;
    }
}

export default ProtectedRoutes;