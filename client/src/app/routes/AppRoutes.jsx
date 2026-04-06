import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import LoginPage from "../features/auth/pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import VisitorDashboard from "../features/dashboard/pages/VisitorDashboard";
import VisitorsPage from "../features/visitors/pages/VisitorsPage";
import CheckInPage from "../features/visitors/pages/CheckInPage";
import ApprovalsPage from "../features/approvals/pages/ApprovalsPage";

const AppRoutes = () => {
  return (
  <Routes>
  {/* Login page */}
  <Route path="/login" element={<LoginPage />} />

  {/* Protected routes */}
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>}>
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="visitors" element={<VisitorsPage />} />
    <Route path="checkin" element={<CheckInPage />} />
    <Route path="approvals" element={<ApprovalsPage />} />
    <Route path="visitordashboard" element={<VisitorDashboard />} />
  </Route>
</Routes>
  );
};

export default AppRoutes;