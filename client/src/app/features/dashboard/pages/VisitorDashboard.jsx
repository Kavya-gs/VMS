import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../../../../services/api";
import QRCode from "react-qr-code";
import { useLocation, useNavigate } from "react-router-dom";

const VisitorDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [checkingOutId, setCheckingOutId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisitors();
  }, [location]);

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/visitors/my-visits");
      const visitList = res.data || [];

      setVisits(visitList);
      const latestOpenVisit = [...visitList]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .find((v) => !v.checkOutTime && v.status !== "rejected" && v.status !== "checked-out");

      setCurrentVisit(latestOpenVisit || null);
    } catch (error) {
      console.error("Error fetching visitors", error);
      toast.error("Failed to fetch your visits");
    }
  };

  const handleCheckout = async (id) => {
    setCheckingOutId(id);
    try {
      await API.post(`/visitors/request-checkout/${id}`);
      toast.success("Checkout request sent to security for approval!");
      fetchVisitors();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Checkout request failed";
      toast.error(errorMessage);
    } finally {
      setCheckingOutId(null);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours ? `${hours}h ` : ""}${minutes}m ${seconds}s`;
  };

  const qrExpiresAt = currentVisit?.qrTokenExpiry
    ? new Date(currentVisit.qrTokenExpiry)
    : null;

  const expectedCheckInAt = currentVisit?.expectedCheckIn
    ? new Date(currentVisit.expectedCheckIn)
    : null;

  const isQrNotActiveYet =
    expectedCheckInAt && currentTime < expectedCheckInAt;

  const isQrExpired = qrExpiresAt && currentTime > qrExpiresAt;

  const isQrActive =
    qrExpiresAt &&
    currentTime >= (expectedCheckInAt || new Date(0)) &&
    currentTime <= qrExpiresAt;

  const isPendingApproval = currentVisit?.status === "pending";
  const isCheckoutRequested = currentVisit?.status === "checkout-requested";
  const statusLabel = isPendingApproval
    ? "Pending Approval"
    : isCheckoutRequested
    ? "Checkout Requested"
    : "Inside";
  const statusClasses = isPendingApproval
    ? "bg-amber-100 text-amber-700"
    : isCheckoutRequested
    ? "bg-blue-100 text-blue-700"
    : "bg-green-100 text-green-600";

  const getCheckInTypeLabel = (visit) => {
    if (visit?.checkInType === "security") return "Manual (Security)";
    if (visit?.checkInType === "admin") return "Manual (Admin)";
    return "Self";
  };

  return (
    <div className="relative p-2 sm:p-4 md:p-6 space-y-6 sm:space-y-7">
      <div className="pointer-events-none absolute -top-6 -left-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-8 right-0 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Visitor Space</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Visitor Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Track your current request, check approval status, and manage checkout actions from one screen.
        </p>
      </section>

      {currentVisit && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="w-full lg:w-auto">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">Current Visit</h2>

            <p className="text-sm text-slate-700">
              <strong>Status:</strong>
              <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.08em] ${statusClasses}`}>
                {statusLabel}
              </span>
            </p>

            <p className="mt-2 text-sm text-slate-700"><strong>Purpose:</strong> {currentVisit.purpose}</p>
            <p className="text-sm text-slate-700"><strong>Host:</strong> {currentVisit.personToMeet}</p>
            <p className="text-sm text-slate-700"><strong>Check-In Type:</strong> {getCheckInTypeLabel(currentVisit)}</p>
            {currentVisit.photo && (
              <img
                src={currentVisit.photo}
                alt="Visitor"
                className="mt-4 rounded-xl w-32 h-36 object-cover border border-slate-200 shadow-sm"
              />
            )}
          </div>

          <div className="w-full lg:w-auto text-center flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3 font-semibold">
              Scan at Gate
            </p>

            {isPendingApproval ? (
              <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Your visit request is submitted and waiting for admin approval.
                QR code and visitor ID will be available once approved.
              </div>
            ) : currentVisit.qrToken ? (
              <>
                <div className="mb-4 p-4 bg-white rounded-xl border border-slate-200 relative shadow-sm">
                  <QRCode value={currentVisit.qrToken} size={100} />

                  {!isQrActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-3 py-1 rounded text-xs font-semibold uppercase tracking-[0.08em]">
                        {isQrNotActiveYet ? "Not Active Yet" : "Expired"}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 text-left w-full">
                  Expected check-in:{" "}
                  {expectedCheckInAt?.toLocaleString("en-IN")}
                </p>

                <p className="text-xs text-slate-500 text-left w-full">
                  Expected checkout:{" "}
                  {currentVisit.expectedCheckOut
                    ? new Date(currentVisit.expectedCheckOut).toLocaleString("en-IN")
                    : "N/A"}
                </p>

                <p
                  className={`text-sm mt-3 font-medium ${
                    isQrExpired
                      ? "text-rose-600"
                      : isQrNotActiveYet
                      ? "text-yellow-600"
                      : "text-emerald-600"
                  }`}
                >
                  {isQrNotActiveYet
                    ? `Activates in ${formatCountdown(
                        expectedCheckInAt - currentTime
                      )}`
                    : isQrExpired
                    ? `Expired ${formatCountdown(
                        currentTime - qrExpiresAt
                      )} ago`
                    : `Expires in ${formatCountdown(
                        qrExpiresAt - currentTime
                      )}`}
                </p>

                <button
                  onClick={() => handleCheckout(currentVisit._id)}
                  disabled={checkingOutId === currentVisit._id || isCheckoutRequested}
                  className="mt-4 w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition"
                >
                  {checkingOutId === currentVisit._id
                    ? "Processing..."
                    : isCheckoutRequested
                    ? "Checkout Requested"
                    : "Request Checkout"}
                </button>
              </>
            ) : (
              <p className="text-red-500 text-sm">
                QR code generating...
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate("/checkin")}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold"
        >
          Request Visit
        </button>
        {currentVisit?.temporaryCardId && (
          <button
            onClick={() => navigate(`/visitor-card/${currentVisit._id}`)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-semibold"
          >
            View Visitor ID Card
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-900">My Visits</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2.5 border border-slate-200">Date</th>
                <th className="p-2.5 border border-slate-200">Purpose</th>
                <th className="p-2.5 border border-slate-200">Host</th>
                <th className="p-2.5 border border-slate-200">Check-In Type</th>
              </tr>
            </thead>

            <tbody>
              {visits.length > 0 ? (
                visits.map((visit) => {
                  return (
                    <tr key={visit._id} className="text-center even:bg-slate-50/70">
                      <td className="p-2.5 border border-slate-200 text-sm text-slate-700">
                        {new Date(visit.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-2.5 border border-slate-200 text-sm text-slate-700">{visit.purpose}</td>
                      <td className="p-2.5 border border-slate-200 text-sm text-slate-700">{visit.personToMeet}</td>
                      <td className="p-2.5 border border-slate-200 text-sm font-medium text-slate-700">{getCheckInTypeLabel(visit)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-500">
                    No visits found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitorDashboard;