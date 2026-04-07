import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchVisitors();
  }, [location]);

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/visitors/my-visits");

      setVisits(res.data || []);

      const activeVisit = res.data.find(v => !v.checkOutTime);
      setCurrentVisit(activeVisit || null);
    } catch (error) {
      console.error("Error fetching visitors", error);
      toast.error("Failed to fetch your visits");
    }
  };

  const handleCheckout = async(id) => {
    setCheckingOutId(id);
    try {
      const res = await API.put(`/visitors/checkout/${id}`);
      toast.success("Checkout successful!");
      fetchVisitors();
    } catch (error) {
      console.error("Error checkout", error);
      const errorMessage = error.response?.data?.message || "Checkout failed";
      toast.error(errorMessage);
    } finally {
      setCheckingOutId(null);
    }
  }

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

  const qrExpiresAt = currentVisit?.qrTokenExpiry ? new Date(currentVisit.qrTokenExpiry) : null;
  const expectedCheckInAt = currentVisit?.expectedCheckIn ? new Date(currentVisit.expectedCheckIn) : null;
  const isQrNotActiveYet = expectedCheckInAt && currentTime < expectedCheckInAt;
  const isQrExpired = qrExpiresAt && currentTime > qrExpiresAt;
  const isQrActive = qrExpiresAt && currentTime >= (expectedCheckInAt || new Date(0)) && currentTime <= qrExpiresAt;

  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Visitor Dashboard</h1>

      {currentVisit && (
        <div className="bg-white shadow-lg rounded-xl p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-2">Current Visit</h2>

            <p><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                currentVisit.status === "approved"
                  ? "bg-green-100 text-green-600"
                  : currentVisit.status === "pending"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-red-100 text-red-600"
              }`}>
                {currentVisit.status}
              </span>
            </p>

            <p><strong>Purpose:</strong> {currentVisit.purpose}</p>
            <p><strong>Host:</strong> {currentVisit.personToMeet}</p>
          </div>

          {currentVisit.status === "approved" && !currentVisit.checkOutTime && (
            <div className="text-center flex flex-col items-center">
              <p className="text-sm text-slate-700 mb-4 font-medium">Scan at Gate</p>
              {currentVisit.qrToken ? (
                <>
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                    <QRCode value={currentVisit.qrToken} size={120} />
                    {/* Overlay */}
                    {!isQrActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 text-white px-3 py-1 rounded text-sm">
                      {isQrNotActiveYet ? "Not Active Yet" : "Expired"}
                      </div>
                    </div>
                  )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Expected check-in: {expectedCheckInAt ? expectedCheckInAt.toLocaleString() : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Expected checkout: {currentVisit.expectedCheckOut ? new Date(currentVisit.expectedCheckOut).toLocaleString() : "N/A"}
                  </p>
                  <p className={`text-sm mt-3 font-medium ${isQrExpired ? "text-rose-600" : isQrNotActiveYet ? "text-yellow-600" : "text-emerald-600"}`}>
                    {isQrNotActiveYet
                      ? `Activates in ${formatCountdown(expectedCheckInAt - currentTime)}`
                      : isQrExpired
                      ? `Expired ${formatCountdown(currentTime - qrExpiresAt)} ago`
                      : `Expires in ${formatCountdown(qrExpiresAt - currentTime)}`}
                  </p>
                </>
              ) : (
                <p className="text-red-500 text-sm">QR code generating...</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/checkin")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Request Visit
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">My Visits</h2>

        <table className="w-full border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Purpose</th>
              <th className="p-2 border">Host</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Checked Out</th>
            </tr>
          </thead>
          <tbody>
            {visits.length > 0 ? (
              visits.map((visit) => (
                <tr key={visit._id} className="text-center">
                  <td className="p-2 border">
                    {new Date(visit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">{visit.purpose}</td>
                  <td className="p-2 border">{visit.personToMeet}</td>
                  <td className="p-2 border">
                    <span className={`px-2 py-1 rounded text-sm ${
                      visit.status === "approved"
                        ? "bg-green-100 text-green-600"
                        : visit.status === "pending"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {visit.status}
                    </span>
                  </td>
                  <td className="p-2 border">
                    {visit.checkOutTime ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : visit.status === "approved" ? (
                      (() => {
                        const expired = visit.qrTokenExpiry && new Date() > new Date(visit.qrTokenExpiry);
                        const notActive = visit.expectedCheckIn && new Date() < new Date(visit.expectedCheckIn);
                        return (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleCheckout(visit._id)}
                              disabled={checkingOutId === visit._id || expired || notActive}
                              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded font-semibold transition"
                            >
                              {checkingOutId === visit._id ? "Checking out..." : "Checkout"}
                            </button>
                            {(expired || notActive) && (
                              <p className="text-xs text-gray-500">
                                {expired ? "QR expired" : "Not active yet"}
                              </p>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-gray-500">Pending Approval</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No visits found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitorDashboard;