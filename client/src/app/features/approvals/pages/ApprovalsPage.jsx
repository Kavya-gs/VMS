import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import API from '../../../../services/api';

const ApprovalsPage = () => {

  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    fetchVisitors();
  },[]);

  const fetchVisitors = async() => {
    try {
      const res = await API.get("/visitors");
      const pendingVisitors = res.data.filter((visitor) => visitor.status === "pending")
      setVisitors(pendingVisitors);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch visitors");
    }
  }

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
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Pending Visitor's Approval</h1>
     <div className="bg-white shadow rounded-lg">
      <table className='w-full'>
        <thead className='bg-gray-100'>
          <tr>
            <th className='p-3 text-left'>Name</th>
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
              <td className="p-3">{visitor.name}</td>
              <td className="p-3">{visitor.purpose}</td>
              <td className="p-3">{visitor.personToMeet}</td>
              <td className="p-3">{visitor.expectedCheckIn ? new Date(visitor.expectedCheckIn).toLocaleString() : "-"}</td>
              <td className="p-3">{visitor.expectedCheckOut ? new Date(visitor.expectedCheckOut).toLocaleString() : "-"}</td>
              <td className="p-3 flex gap-2">
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
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center p-4">
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