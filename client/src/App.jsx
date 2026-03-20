import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import DashboardPage from './app/features/dashboard/pages/DashboardPage'
import CheckInPage from './app/features/visitors/pages/CheckInPage'
import VisitorsPage from './app/features/visitors/pages/VisitorsPage'
import ApprovalsPage from './app/features/approvals/pages/ApprovalsPage'
import LoginPage from './app/features/auth/pages/LoginPage'
import RoleProtectedRoute from './app/routes/RoleProtectedRoute'
import ProtectedRoute from './app/routes/ProtectedRoute'
import ReportPage from './app/features/reports/pages/ReportPage'
import VisitorDashboard from './app/features/dashboard/pages/VisitorDashboard'
import CheckoutPage from './app/features/checkout/pages/CheckoutPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>}>

          {/* Default redirect */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "security", "visitor"]}>
                <DashboardPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="visitors"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "security"]}>
                <VisitorsPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="checkin"
            element={
              <RoleProtectedRoute allowedRoles={["visitor", "security"]}>
                <CheckInPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="approvals"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ApprovalsPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="reports"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ReportPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="visitordashboard"
            element={
              <RoleProtectedRoute allowedRoles={["visitor"]}>
                <VisitorDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <RoleProtectedRoute allowedRoles={["visitor", "security"]}>
                <CheckoutPage />
              </RoleProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default App