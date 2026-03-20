import { useEffect, useState } from "react";
import API from "../../../../services/api";

const VisitorsPage = () => {
  const [visitors, setVisitors] = useState([]);

  // filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


const filterVisitor = visitors.filter((visitor) => {

  const matchSearch =
    visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.purpose.toLowerCase().includes(searchTerm.toLowerCase());

  const matchStatus =
    statusFilter === "all" ||
    (statusFilter === "inside" && !visitor.checkOutTime) ||
    (statusFilter === "checkedout" && visitor.checkOutTime!== null && visitor.checkOutTime !== undefined);

  return matchSearch && matchStatus;
});

  const fetchVisitors = async () => {
  try {
    const res = await API.get("/visitors");
    const Resvisitors = res.data.filter((visitor) => visitor.status === "approved");
    setVisitors(Resvisitors);
  } catch (error) {
    console.error(error);
  }
};

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleCheckout = async (id) => {
    try {
      await API.put(`/visitors/checkout/${currentVisit._id}`);
      alert("Visitor checked out");
      fetchVisitors(); // refresh table
    } catch (error) {
      console.error(error);
      alert("Checkout failed");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Visitors</h1>
      {/* filter and search */}
      <div className="flex gap-4 mb-6">
          <input 
          type="text"
          placeholder="Search Visitors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="border px-4 py-2 rounded w-64"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-4 py-2 rounded">
            <option value="all">All</option>
            <option value="inside">Inside</option>
            <option value="checkedout">Checked-Out</option>
          </select>
      </div>

      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 border">Name</th>
            <th className="p-3 border">Email</th>
            <th className="p-3 border">Purpose</th>
            <th className="p-3 border">Person To Meet</th>
            <th className="p-3 border">Check-In</th>
            <th className="p-3 border">Check-Out</th>
            <th className="p-3 border">Status</th>
            <th className="p-3 border">Action</th>
          </tr>
        </thead>

        <tbody>
          {filterVisitor.map((visitor) => (
            <tr key={visitor._id} className="text-center">

              <td className="border p-2">{visitor.name}</td>
              <td className="border p-2">{visitor.email}</td>
              <td className="border p-2">{visitor.purpose}</td>
              <td className="border p-2">{visitor.personToMeet}</td>

              <td className="border p-2">
                {new Date(visitor.createdAt).toLocaleString()}
              </td>

              <td className="border p-2">
                {visitor.checkOutTime
                  ? new Date(visitor.checkOutTime).toLocaleString()
                  : "—"}
              </td>

              {/* STATUS */}
              <td className="border p-2">
                {visitor.checkOutTime ? (
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                    Checked Out
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">
                    Inside
                  </span>
                )}
              </td>

              {/* ACTION */}
              <td className="border p-2">
                {!visitor.checkOutTime ? (
                  <button
                    onClick={handleCheckout}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Checkout
                  </button>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VisitorsPage;