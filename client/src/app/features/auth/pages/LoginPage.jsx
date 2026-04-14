import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { loginSchema } from "../../../../validations/authSchema";
import { useAuth } from "../../../../contexts/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal") || "visitor";
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: yupResolver(loginSchema),
  });

  const handleLogin = async (formData) => {
    setLoading(true);
    try {
      await login(formData);
      
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
    <div className="auth-shell">
      <form onSubmit={handleSubmit(handleLogin)} className="auth-card">
        <h2 className="auth-title">Sign In</h2>
        <p className="auth-subtitle mb-6">
          {portal === "staff" ? "Admin / Security Portal" : "Visitor Portal"}
        </p>
        
        <div className="mb-4">
          <label className="auth-label">Email</label>
          <input 
            type="email" 
            placeholder="Email" 
            {...register("email")}
            disabled={loading}
            aria-invalid={errors.email ? "true" : "false"}
            className={`auth-input mt-1 ${errors.email ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : ""}`}
          />
          {errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
        
        <div className="mb-4">
          <label className="auth-label">Password</label>
          <input 
            type="password"
            placeholder="Password"
            {...register("password")}
            disabled={loading}
            aria-invalid={errors.password ? "true" : "false"}
            className={`auth-input mt-1 ${errors.password ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : ""}`}
          />
          {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password.message}</p>}
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="auth-btn auth-btn-primary"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        <p className="text-sm mt-4 text-center text-gray-600">
          {portal === "staff" ? (
            <span
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => navigate("/")}
            >
              Back to landing
            </span>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <span
                className="text-blue-500 cursor-pointer hover:underline"
                onClick={() => navigate("/register")}
              >
                Register
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

export default LoginPage;