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
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const handleRegister = async(formData) => {
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;
      await API.post("/auth/register", dataToSend);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit(handleRegister)}
        className="p-6 bg-white shadow-md rounded w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Full Name"
            {...register("name")}
            disabled={loading}
            className="border p-2 w-full rounded focus:outline-none focus:border-green-500"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            disabled={loading}
            className="border p-2 w-full rounded focus:outline-none focus:border-green-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Password (8+ chars, uppercase, lowercase, number)"
            {...register("password")}
            disabled={loading}
            className="border p-2 w-full rounded focus:outline-none focus:border-green-500"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword")}
            disabled={loading}
            className="border p-2 w-full rounded focus:outline-none focus:border-green-500"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded w-full font-semibold transition"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;