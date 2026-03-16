import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import DashboardPage from './app/features/dashboard/pages/DashboardPage'
import CheckInPage from './app/features/visitors/pages/CheckInPage'
import VisitorsPage from './app/features/visitors/pages/VisitorsPage'
import CheckoutPage from './app/features/checkout/pages/CheckoutPage'
import ApprovalsPage from './app/features/approvals/pages/ApprovalsPage'
import LoginPage from './app/features/auth/pages/LoginPage'
import RoleProtectedRoutes from './app/routes/RoleProtectedRoutes'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<div style={{ textAlign: 'center', padding: '40px' }}><h1>Welcome to Visitor Management System</h1></div>} />
          <Route path="dashboard" element={<RoleProtectedRoutes allowedRoles={["admin", "security"]}>
            <DashboardPage />
          </RoleProtectedRoutes>} />
          <Route path="visitors" element={<RoleProtectedRoutes allowedRoles={["admin", "security"]}>
            <VisitorsPage />
          </RoleProtectedRoutes>} />
          <Route path="checkin" element={<RoleProtectedRoutes allowedRoles={["visitor"]}>
            <CheckInPage />
          </RoleProtectedRoutes>} />
          <Route path="checkout" element={<CheckoutPage/>} />
          <Route path="approvals" element={<RoleProtectedRoutes allowedRoles={["admin"]}>
            <ApprovalsPage />
          </RoleProtectedRoutes>} />
          <Route path="login" element={<LoginPage/>} />
          <Route path="reports" element={<div>Reports Page</div>} />
          <Route path="settings" element={<div>Settings Page</div>} />
          <Route path="privacy" element={<div>Privacy Policy</div>} />
          <Route path="terms" element={<div>Terms of Service</div>} />
          <Route path="contact" element={<div>Contact Us</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App