import React, { useEffect, useState } from 'react'
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
    }
  }

  const approveVisitor = async(id) => {
    try {
      await API.put(`/visitors/approve/${id}`);
      alert("Visitor approved");
      fetchVisitors();
    } catch (error) {
      console.error(error);
    }
  }

  const rejectVisitor = async(id) => {
    try {
      await API.put(`/visitors/reject/${id}`);
      alert("Visitor rejected");
      fetchVisitors();
    } catch (error) {
      console.error(error);
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
            <td colSpan="4" className="text-center p-4">
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