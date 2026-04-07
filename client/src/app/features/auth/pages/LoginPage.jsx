import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import API from "../../../../services/api";
import { loginSchema } from "../../../../validations/authSchema";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const handleLogin = async(formData) => {
    setLoading(true);
    try {
      const res = await API.post("/auth/login", formData);
      const roleFromAPI = res.data.role || res.data?.user.role;
      
      if(!roleFromAPI){
        toast.error("Role information missing");
        setLoading(false);
        return;
      }
      
      const role = roleFromAPI.toLowerCase();
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      toast.success("Login successful!");
      navigate("/dashboard");
      
    } catch (error) {
      console.error("Error logging in", error);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit(handleLogin)} className="p-6 bg-white shadow-md rounded w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        
        <div className="mb-4">
          <input 
            type="email" 
            placeholder="Email" 
            {...register("email")}
            disabled={loading}
            className="border p-2 w-full rounded focus:outline-none focus:border-blue-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        
        <div className="mb-4">
          <input 
            type="password"
            placeholder="Password"
            {...register("password")}
            disabled={loading}
            className="border p-2 w-full rounded focus:outline-none focus:border-blue-500"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded w-full font-semibold transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        <p className="text-sm mt-4 text-center text-gray-600">
          Don't have an account?{" "}
          <span 
            className="text-blue-500 cursor-pointer hover:underline" 
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;