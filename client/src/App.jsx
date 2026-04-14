import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './app/layouts/MainLayout'
import DashboardPage from './app/features/dashboard/pages/DashboardPage'
import CheckInPage from './app/features/visitors/pages/CheckInPage'
import VisitorsPage from './app/features/visitors/pages/VisitorsPage'
import ApprovalsPage from './app/features/approvals/pages/ApprovalsPage'
import LoginPage from './app/features/auth/pages/LoginPage'
import LandingPage from './app/features/auth/pages/LandingPage'
import RoleProtectedRoute from './app/routes/RoleProtectedRoute'
import ProtectedRoute from './app/routes/ProtectedRoute'
import ReportPage from './app/features/reports/pages/ReportPage'
import VisitorDashboard from './app/features/dashboard/pages/VisitorDashboard'
import CheckoutPage from './app/features/checkout/pages/CheckoutPage'
import { Toaster } from "react-hot-toast";
import ProfilePage from './app/features/auth/pages/ProfilePage'
import RegisterPage from './app/features/auth/pages/RegisterPage'
import HelpPage from './app/features/misc/pages/HelpPage'
import ContactPage from './app/features/misc/pages/ContactPage'
import PrivacyPage from './app/features/misc/pages/PrivacyPage'
import TermsPage from './app/features/misc/pages/TermsPage'
import CookiesPage from './app/features/misc/pages/CookiesPage'
import { LoadingProvider } from './contexts/LoadingContext'
import GlobalLoader from './components/GlobalLoader'
import AppInitializer from './components/AppInitializer'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <LoadingProvider>
      <AppInitializer>
        <AuthProvider>
          <Toaster position='top-right' />
          <GlobalLoader />
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
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
                <Route
                  path="profile"
                  element={
                    <RoleProtectedRoute allowedRoles={["visitor", "security", "admin"]}>
                      <ProfilePage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="help"
                  element={
                    <RoleProtectedRoute allowedRoles={["visitor", "security", "admin"]}>
                      <HelpPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="contact"
                  element={
                    <RoleProtectedRoute allowedRoles={["visitor", "security", "admin"]}>
                      <ContactPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="privacy"
                  element={
                    <RoleProtectedRoute allowedRoles={["visitor", "security", "admin"]}>
                      <PrivacyPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="terms"
                  element={
                    <RoleProtectedRoute allowedRoles={["visitor", "security", "admin"]}>
                      <TermsPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="cookies"
                  element={
                    <RoleProtectedRoute allowedRoles={["visitor", "security", "admin"]}>
                      <CookiesPage />
                    </RoleProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </AppInitializer>
    </LoadingProvider>
  );
}

export default App