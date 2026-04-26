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

      setVisits(res.data || []);
      const activeVisit = res.data.find(
        (v) => v.status === "approved" && v.checkInTime && !v.checkOutTime
      );

      setCurrentVisit(activeVisit || null);
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

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Visitor Dashboard</h1>

      {currentVisit && (
        <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="w-full lg:w-auto">
            <h2 className="text-lg font-semibold mb-2">Current Visit</h2>

            <p>
              <strong>Status:</strong>
              <span className="ml-2 px-2 py-1 rounded text-sm bg-green-100 text-green-600">
                Inside
              </span>
            </p>

            <p><strong>Purpose:</strong> {currentVisit.purpose}</p>
            <p><strong>Host:</strong> {currentVisit.personToMeet}</p>
            {currentVisit.photo && (
              <img
                src={currentVisit.photo}
                alt="Visitor"
                className="mt-4 rounded-lg w-32 h-36 object-cover border border-slate-200"
              />
            )}
          </div>

          <div className="w-full lg:w-auto text-center flex flex-col items-center">
            <p className="text-sm text-slate-700 mb-4 font-medium">
              Scan at Gate
            </p>

            {currentVisit.qrToken ? (
              <>
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border relative">
                  <QRCode value={currentVisit.qrToken} size={100} />

                  {!isQrActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 text-white px-3 py-1 rounded text-sm">
                        {isQrNotActiveYet ? "Not Active Yet" : "Expired"}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Expected check-in:{" "}
                  {expectedCheckInAt?.toLocaleString("en-IN")}
                </p>

                <p className="text-xs text-slate-500">
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
                  disabled={checkingOutId === currentVisit._id}
                  className="mt-4 w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  {checkingOutId === currentVisit._id ? "Processing..." : "Request Checkout"}
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
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Request Visit
        </button>
        {currentVisit?.temporaryCardId && (
          <button
            onClick={() => navigate(`/visitor-card/${currentVisit._id}`)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg"
          >
            View Visitor ID Card
          </button>
        )}
      </div>

      <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">My Visits</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Purpose</th>
                <th className="p-2 border">Host</th>
              </tr>
            </thead>

            <tbody>
              {visits.length > 0 ? (
                visits.map((visit) => {
                  return (
                    <tr key={visit._id} className="text-center">
                      <td className="p-2 border">
                        {new Date(visit.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-2 border">{visit.purpose}</td>
                      <td className="p-2 border">{visit.personToMeet}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">
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