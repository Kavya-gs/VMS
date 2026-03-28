import React, { useEffect, useState } from "react";
import API from "../../../../services/api";
import QRCode from "react-qr-code";
import { useLocation, useNavigate } from "react-router-dom";

const VisitorDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
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
    }
  };

  const handleCheckout = async(id) => {
    try {
      const res = await API.put(`/visitors/checkout/${id}`);
      fetchVisitors();
    } catch (error) {
      console.error("Error fetching", error);
    }
  }

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
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Scan at Gate</p>
              <QRCode value={currentVisit._id} size={100} />
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
                  <td className="p-2 border">{visit.checkOutTime ? (
                  <span className="text-green-600 font-medium">Yes</span>) : (
                  <button onClick={() => handleCheckout(visit._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                  Checkout
                  </button>
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