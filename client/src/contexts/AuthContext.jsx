import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setUser(null);
      setAuthLoading(false);
      return null;
    }

    try {
      const response = await API.get("/auth/profile", { showLoader: false });
      const profile = response.data;
      setUser(profile);
      return profile;
    } catch (error) {
      clearAuth();
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(async (credentials, captchaToken, portal = "visitor") => {
    const response = await API.post("/auth/login", { ...credentials, captchaToken, portal });
    if (response.data?.otpRequired) {
      return response.data;
    }

    const nextToken = response.data?.token;

    if (!nextToken) {
      throw new Error("Authentication token missing from login response");
    }

    localStorage.setItem("token", nextToken);
    setToken(nextToken);
    setAuthLoading(true);

    const profile = await fetchProfile();
    if (!profile) {
      throw new Error("Failed to fetch profile after login");
    }

    return profile;
  }, [fetchProfile]);

  const verifyOtp = useCallback(async ({ email, otp }) => {
    const response = await API.post("/auth/verify-otp", { email, otp });
    const nextToken = response.data?.token;

    if (!nextToken) {
      throw new Error("Authentication token missing from OTP response");
    }

    localStorage.setItem("token", nextToken);
    setToken(nextToken);
    setAuthLoading(true);

    const profile = await fetchProfile();
    if (!profile) {
      throw new Error("Failed to fetch profile after OTP verification");
    }

    return profile;
  }, [fetchProfile]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(() => ({
    token,
    user,
    role: user?.role || "",
    isAuthenticated: Boolean(token),
    authLoading,
    login,
    verifyOtp,
    logout,
    refreshProfile: fetchProfile,
  }), [token, user, authLoading, login, verifyOtp, logout, fetchProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
