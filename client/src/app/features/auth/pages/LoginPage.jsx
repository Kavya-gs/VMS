import { useState } from "react"
import API from "../../../../services/api";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async(e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      })
      const roleFromAPI = res.data.role || res.data?.user.role;
      if(!roleFromAPI){
        alert("Role missing");
      }
      const role = roleFromAPI.toLowerCase();
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", role);
      
      if (role === "admin" || role === "security") {
        navigate("/dashboard");
      } 
      else if (role === "visitor") {
        navigate("/checkin");
      }
      else{
        navigate("/dashboard");
      }
      localStorage.setItem("role", role.toLowerCase());
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error logging in", error);
      alert("Login failed");
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin} className="p-6 bg-white shadow-md rounded">
        <h2 className="text-xl mb-4">Login</h2>
        <input 
        type="email" 
        placeholder="Email" 
        className="border p-2 mb-3 w-full"
        onChange={(e) => setEmail(e.target.value)}
        />
        
        <input 
        type="password"
        placeholder="Password"
        className="border p-2 mb-3 w-full"
        onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">Submit</button>
      </form>
    </div>
  )
}

export default LoginPage