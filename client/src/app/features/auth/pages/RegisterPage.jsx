import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import API from "../../../../services/api";
import { registerSchema } from "../../../../validations/authSchema";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: yupResolver(registerSchema),
  });

  const handleRegister = async (formData) => {
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;
      await API.post("/auth/register", dataToSend);
      toast.success("Registration successful! Please login.");
      navigate("/login?portal=visitor");
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <form
        onSubmit={handleSubmit(handleRegister)}
        className="auth-card"
      >
        <h2 className="auth-title mb-6">Create Visitor Account</h2>

        <div className="mb-4">
          <label className="auth-label">Full Name</label>
          <input
            type="text"
            placeholder="Full Name"
            {...register("name")}
            disabled={loading}
            aria-invalid={errors.name ? "true" : "false"}
            className={`auth-input mt-1 ${errors.name ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : ""}`}
          />
          {errors.name && <p className="text-rose-600 text-sm mt-1">{errors.name.message}</p>}
        </div>

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
            placeholder="Password (8+ chars, uppercase, lowercase, number)"
            {...register("password")}
            disabled={loading}
            aria-invalid={errors.password ? "true" : "false"}
            className={`auth-input mt-1 ${errors.password ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : ""}`}
          />
          {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div className="mb-4">
          <label className="auth-label">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword")}
            disabled={loading}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            className={`auth-input mt-1 ${errors.confirmPassword ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : ""}`}
          />
          {errors.confirmPassword && <p className="text-rose-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="auth-btn auth-btn-success"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/login?portal=visitor")}
          >
            Login
          </span>
        </p>

        <p className="text-xs mt-2 text-center text-gray-500">
          Need staff login?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/")}
          >
            Go to landing
          </span>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;