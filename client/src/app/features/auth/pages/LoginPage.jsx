import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { loginSchema } from "../../../../validations/authSchema";
import { useAuth } from "../../../../contexts/useAuth";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(loginSchema),
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
          if (authStage === "credentials") {
            handleSubmit(handleLogin)(event);
            return;
          }

          handleVerifyOtp();
        }}
        className="auth-card"
      >
        <h2 className="auth-title">Sign In</h2>

        <p className="auth-subtitle mb-6">
          {portal === "staff"
            ? "Admin / Security Portal"
            : "Visitor Portal"}
        </p>

        {authStage === "credentials" ? (
          <>
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
        ) : (
          <>
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
        )}

        {portal !== "staff" && (
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