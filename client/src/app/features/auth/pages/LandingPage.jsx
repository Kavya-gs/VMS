import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Role-Based Access Portal
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            Visitor Management System
          </h1>
          <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-3xl mx-auto">
            Secure, role-based access for administration, security operations, and visitor self-service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <section className="rounded-2xl border border-blue-100 bg-white p-6 sm:p-8 shadow-lg">
            <p className="text-blue-700 font-semibold uppercase text-xs tracking-wider">Staff Portal</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Admin / Security</h2>
            <p className="mt-3 text-slate-600">
              Sign in with your assigned credentials to access approval, reports, and gate operations.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li>• Admin dashboard and approvals</li>
              <li>• Security check-in and checkout flow</li>
              <li>• Live notifications and audit visibility</li>
            </ul>
            <button
              onClick={() => navigate("/login?portal=staff")}
              className="mt-8 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold transition"
            >
              Login as Admin / Security
            </button>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-lg">
            <p className="text-emerald-700 font-semibold uppercase text-xs tracking-wider">Visitor Portal</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Visitor Access</h2>
            <p className="mt-3 text-slate-600">
              Create an account or sign in to submit visit requests, track approvals, and view your QR pass.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li>• Self registration</li>
              <li>• Check-in request status tracking</li>
              <li>• Visit history and checkout status</li>
            </ul>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/register")}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 font-semibold transition"
              >
                Register as Visitor
              </button>
              <button
                onClick={() => navigate("/login?portal=visitor")}
                className="rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 px-5 py-3 font-semibold transition"
              >
                Login as Visitor
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
