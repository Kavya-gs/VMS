import React, { useEffect, useState } from "react";
import API from "../../../../services/api";

const VisitorDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/visitors/my-visits");

      setVisits(res.data);

      if (res.data.length > 0) {
        setCurrentVisit(res.data[0]); 
      }
    } catch (error) {
      console.error("Error fetching visitors", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Visitor Dashboard</h1>

      {/* Current Visit */}
      {currentVisit && (
        <div className="bg-white shadow p-4 mb-4">
          <p><strong>Status:</strong> {currentVisit.status}</p>
          <p><strong>Purpose:</strong> {currentVisit.purpose}</p>
          <p><strong>Host:</strong> {currentVisit.personToMeet}</p>
        </div>
      )}

      {/* Visits List */}
      <div>
        <h2 className="font-semibold mb-2">My Visits</h2>
        {visits.map((visit) => (
          <div key={visit._id} className="border p-2 mb-2">
            <p>{visit.purpose}</p>
            <p>{visit.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisitorDashboard;