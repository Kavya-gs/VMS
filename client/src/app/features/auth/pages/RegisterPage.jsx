import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import API from "../../../../services/api";
import { registerSchema } from "../../../../validations/authSchema";
import ReCAPTCHA from "react-google-recaptcha";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(registerSchema),
  });

  const handleRegister = async (formData) => {
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;

      await API.post("/auth/register", {
        ...dataToSend,
        captchaToken,
      });

      toast.success("Registration successful! Please login.");

      reset();
      setCaptchaToken(null);
      captchaRef.current?.reset();

      navigate("/login?portal=visitor");
    } catch (error) {
      console.error(error);

      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      toast.error(errorMessage);

      setCaptchaToken(null);
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <form onSubmit={handleSubmit(handleRegister)} className="auth-card">
        <h2 className="auth-title mb-6">Create Visitor Account</h2>

        <div className="mb-4">
          <label className="auth-label">Full Name</label>
          <input
            type="text"
            placeholder="Full Name"
            {...register("name")}
            disabled={loading}
            className={`auth-input mt-1 ${
              errors.name ? "border-rose-500 bg-rose-50" : ""
            }`}
          />
          {errors.name && (
            <p className="text-rose-600 text-sm mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="auth-label">Email</label>
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            disabled={loading}
            className={`auth-input mt-1 ${
              errors.email ? "border-rose-500 bg-rose-50" : ""
            }`}
          />
          {errors.email && (
            <p className="text-rose-600 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="auth-label">Password</label>
          <input
            type="password"
            placeholder="Password (8+ chars, uppercase, lowercase, number)"
            {...register("password")}
            disabled={loading}
            className={`auth-input mt-1 ${
              errors.password ? "border-rose-500 bg-rose-50" : ""
            }`}
          />
          {errors.password && (
            <p className="text-rose-600 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="auth-label">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword")}
            disabled={loading}
            className={`auth-input mt-1 ${
              errors.confirmPassword ? "border-rose-500 bg-rose-50" : ""
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-rose-600 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center my-4">
          <p className="text-xs text-gray-500 mb-2">
            Please verify you are not a robot
          </p>
          <ReCAPTCHA
            ref={captchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isValid || !captchaToken}
          className="auth-btn auth-btn-success"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* LINKS */}
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