import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import {
  loginSchema,
  forgotPasswordEmailSchema,
  forgotPasswordOtpSchema,
  forgotPasswordResetSchema,
} from "../../../../validations/authSchema";
import { useAuth } from "../../../../contexts/useAuth";
import API from "../../../../services/api";
import ReCAPTCHA from "react-google-recaptcha";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal") || "visitor";
  const { login, verifyOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [authStage, setAuthStage] = useState("credentials");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const captchaRef = useRef(null);

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("");
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(loginSchema),
  });

  const {
    register: registerForgotEmail,
    handleSubmit: handleSubmitForgotEmail,
    formState: { errors: errorsForgotEmail, isValid: isValidForgotEmail },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(forgotPasswordEmailSchema),
  });

  const {
    register: registerForgotReset,
    handleSubmit: handleSubmitForgotReset,
    formState: { errors: errorsForgotReset, isValid: isValidForgotReset },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(forgotPasswordResetSchema),
  });

  const handleLogin = async (formData) => {
    setLoading(true);
    try {
      const loginResult = await login(formData, captchaToken, portal);

      if (loginResult?.otpRequired) {
        setPendingEmail(loginResult.email || formData.email);
        setAuthStage("otp");
        toast.success("OTP sent to your email");
        return;
      }

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error logging in", error);

      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";

      toast.error(errorMessage);
      setCaptchaToken(null);
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email: pendingEmail, otp: otp.trim() });
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "OTP verification failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (formData) => {
    setLoading(true);
    try {
      const response = await API.post("/auth/forgot-password/request", {
        email: formData.email.trim().toLowerCase(),
      });

      setForgotPasswordEmail(formData.email.trim().toLowerCase());
      setAuthStage("forgot-otp");
      toast.success("OTP sent to your email");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to process request. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordVerifyOtp = async () => {
    if (forgotPasswordOtp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/forgot-password/verify", {
        email: forgotPasswordEmail,
        otp: forgotPasswordOtp.trim(),
      });

      setAuthStage("forgot-reset");
      toast.success("OTP verified successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "OTP verification failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 3: Reset Password
  const handleForgotPasswordReset = async (formData) => {
    setLoading(true);
    try {
      await API.post("/auth/forgot-password/reset", {
        email: forgotPasswordEmail,
        newPassword: formData.newPassword,
      });

      toast.success("Password reset successfully! Please login with your new password.");
      setForgotPasswordEmail("");
      setForgotPasswordOtp("");
      setForgotPasswordNewPassword("");
      setForgotPasswordConfirmPassword("");
      setAuthStage("credentials");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setForgotPasswordEmail("");
    setForgotPasswordOtp("");
    setForgotPasswordNewPassword("");
    setForgotPasswordConfirmPassword("");
    setAuthStage("credentials");
  };

  return (
    <div className="auth-shell">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed left-4 top-4 z-20 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Back to Main Page
      </button>

      <form
        onSubmit={(event) => {
          event.preventDefault();

          // Login OTP verification
          if (authStage === "credentials") {
            handleSubmit(handleLogin)(event);
            return;
          }

          if (authStage === "otp") {
            handleVerifyOtp();
            return;
          }

          // Forgot Password flows
          if (authStage === "forgot-email") {
            handleSubmitForgotEmail(handleForgotPasswordRequest)(event);
            return;
          }

          if (authStage === "forgot-otp") {
            handleForgotPasswordVerifyOtp();
            return;
          }

          if (authStage === "forgot-reset") {
            handleSubmitForgotReset(handleForgotPasswordReset)(event);
            return;
          }
        }}
        className="auth-card"
      >
        {authStage === "credentials" ? (
          <>
            <h2 className="auth-title">Sign In</h2>

            <p className="auth-subtitle mb-6">
              {portal === "staff"
                ? "Admin / Security Portal"
                : "Visitor Portal"}
            </p>

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
                placeholder="Password"
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

            <button
              type="button"
              onClick={() => setAuthStage("forgot-email")}
              className="text-sm text-blue-500 hover:underline mb-4"
            >
              Forgot Password?
            </button>

            <div className="flex justify-center my-4">
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isValid || !captchaToken}
              className="auth-btn auth-btn-primary"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        ) : authStage === "otp" ? (
          <>
            <h2 className="auth-title">Verify OTP</h2>

            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
              OTP sent to <span className="font-semibold">{pendingEmail}</span>
            </div>

            <div className="mb-4">
              <label className="auth-label">Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                disabled={loading}
                className="auth-input mt-1 tracking-[0.35em] text-center"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="auth-btn auth-btn-primary"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthStage("credentials");
                setOtp("");
                setCaptchaToken(null);
                captchaRef.current?.reset();
              }}
              className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to credentials
            </button>
          </>
        ) : authStage === "forgot-email" ? (
          <>
            <h2 className="auth-title">Forgot Password</h2>

            <p className="auth-subtitle mb-6">
              Enter your registered email to receive an OTP
            </p>

            <div className="mb-4">
              <label className="auth-label">Email</label>
              <input
                type="email"
                placeholder="Email"
                {...registerForgotEmail("email")}
                disabled={loading}
                className={`auth-input mt-1 ${
                  errorsForgotEmail.email ? "border-rose-500 bg-rose-50" : ""
                }`}
              />
              {errorsForgotEmail.email && (
                <p className="text-rose-600 text-sm mt-1">
                  {errorsForgotEmail.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isValidForgotEmail}
              className="auth-btn auth-btn-primary"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <button
              type="button"
              onClick={closeForgotPassword}
              className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </>
        ) : authStage === "forgot-otp" ? (
          <>
            <h2 className="auth-title">Verify OTP</h2>

            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
              OTP sent to <span className="font-semibold">{forgotPasswordEmail}</span>
            </div>

            <div className="mb-4">
              <label className="auth-label">Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                value={forgotPasswordOtp}
                onChange={(event) =>
                  setForgotPasswordOtp(event.target.value.replace(/\D/g, ""))
                }
                disabled={loading}
                className="auth-input mt-1 tracking-[0.35em] text-center"
              />
            </div>

            <button
              type="submit"
              disabled={loading || forgotPasswordOtp.length !== 6}
              className="auth-btn auth-btn-primary"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => setAuthStage("forgot-email")}
              className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </>
        ) : authStage === "forgot-reset" ? (
          <>
            <h2 className="auth-title">Reset Password</h2>

            <p className="auth-subtitle mb-6">
              Create your new password
            </p>

            <div className="mb-4">
              <label className="auth-label">New Password</label>
              <input
                type="password"
                placeholder="New Password"
                {...registerForgotReset("newPassword")}
                disabled={loading}
                className={`auth-input mt-1 ${
                  errorsForgotReset.newPassword ? "border-rose-500 bg-rose-50" : ""
                }`}
              />
              {errorsForgotReset.newPassword && (
                <p className="text-rose-600 text-sm mt-1">
                  {errorsForgotReset.newPassword.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="auth-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm Password"
                {...registerForgotReset("confirmPassword")}
                disabled={loading}
                className={`auth-input mt-1 ${
                  errorsForgotReset.confirmPassword ? "border-rose-500 bg-rose-50" : ""
                }`}
              />
              {errorsForgotReset.confirmPassword && (
                <p className="text-rose-600 text-sm mt-1">
                  {errorsForgotReset.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isValidForgotReset}
              className="auth-btn auth-btn-primary"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setAuthStage("forgot-otp")}
              className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </>
        ) : null}

        {(authStage === "credentials" && portal !== "staff") && (
          <p className="text-sm mt-4 text-center text-gray-600">
            Don’t have an account?{" "}
            <span
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPage;