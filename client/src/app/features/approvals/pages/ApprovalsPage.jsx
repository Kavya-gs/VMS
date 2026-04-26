import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import API from '../../../../services/api';

const ApprovalsPage = () => {

  const [visitors, setVisitors] = useState([]);

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await API.get("/visitors");
      const pendingVisitors = res.data.filter((visitor) => visitor.status === "pending");
      setVisitors(pendingVisitors);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch visitors");
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const approveVisitor = async(id) => {
    try {
      await API.put(`/visitors/approve/${id}`);
      toast.success("Visitor approved!");
      fetchVisitors();
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to approve visitor";
      toast.error(errorMessage);
    }
  }

  const rejectVisitor = async(id) => {
    try {
      await API.put(`/visitors/reject/${id}`);
      toast.success("Visitor rejected!");
      fetchVisitors();
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to reject visitor";
      toast.error(errorMessage);
    }
  }

  return (
    <div className='p-2 sm:p-4 md:p-6'>
      <h1 className='text-xl sm:text-2xl font-bold mb-6'>Pending Visitor's Approval</h1>
     <div className="bg-white shadow rounded-lg overflow-x-auto">
      <table className='w-full min-w-[1080px]'>
        <thead className='bg-gray-100'>
          <tr>
            <th className='p-3 text-left'>Photo</th>
            <th className='p-3 text-left'>Name</th>
            <th className='p-3 text-left'>Details</th>
            <th className='p-3 text-left'>Purpose</th>
            <th className='p-3 text-left'>Host</th>
            <th className='p-3 text-left'>Expected In</th>
            <th className='p-3 text-left'>Expected Out</th>
            <th className='p-3 text-left'>Action</th>
          </tr>
        </thead>
      <tbody>
        {visitors.length > 0 ? (
          visitors.map((visitor) => (
            <tr key={visitor._id} className="border-t">
              <td className="p-3">
                {visitor.photo ? (
                  <img
                    src={visitor.photo}
                    alt={`${visitor.name || "Visitor"} profile`}
                    className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-500 text-center px-1">
                    No photo
                  </div>
                )}
              </td>
              <td className="p-3 font-medium text-slate-900">{visitor.name}</td>
              <td className="p-3">
                <div className="space-y-1 text-xs text-slate-600">
                  <p><span className="font-semibold text-slate-700">Email:</span> {visitor.email || "N/A"}</p>
                  <p><span className="font-semibold text-slate-700">Check-In Type:</span> {visitor.checkInType === "self" ? "Self" : visitor.checkInType === "security" ? "Manual (Security)" : visitor.checkInType === "admin" ? "Manual (Admin)" : "N/A"}</p>
                  <p><span className="font-semibold text-slate-700">Requested:</span> {visitor.createdAt ? new Date(visitor.createdAt).toLocaleString("en-GB") : "N/A"}</p>
                </div>
              </td>
              <td className="p-3">{visitor.purpose}</td>
              <td className="p-3">{visitor.personToMeet}</td>
              <td className="p-3">{visitor.expectedCheckIn ? new Date(visitor.expectedCheckIn).toLocaleString("en-GB") : "-"}</td>
              <td className="p-3">{visitor.expectedCheckOut ? new Date(visitor.expectedCheckOut).toLocaleString("en-GB") : "-"}</td>
              <td className="p-3">
                <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => approveVisitor(visitor._id)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectVisitor(visitor._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" className="text-center p-4">
              No pending approvals
            </td>
          </tr>
        )}
      </tbody>
      </table>
     </div>      
    </div>
  )
}

export default ApprovalsPage