import { useEffect, useState } from "react";
import API from "../../../../services/api";
import { useDebounce } from "../../../../hooks/useDebounce";

const VisitorsPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const filterVisitor = visitors.filter((visitor) => {
    const matchSearch =
      visitor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      visitor.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      visitor.purpose.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "inside" &&
        visitor.status === "approved" &&
        visitor.checkInTime &&
        !visitor.checkOutTime) ||
      (statusFilter === "checkedout" &&
        visitor.status === "approved" &&
        visitor.checkOutTime) ||
      (statusFilter === "rejected" && visitor.status === "rejected");

    return matchSearch && matchStatus;
  });

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/visitors");
      setVisitors(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Visitors</h1>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Visitors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded w-full sm:w-64"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-4 py-2 rounded w-full sm:w-auto"
        >
          <option value="all">All</option>
          <option value="inside">Inside</option>
          <option value="checkedout">Checked-Out</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Purpose</th>
              <th className="p-3 border">Person To Meet</th>
              <th className="p-3 border">Check-In</th>
              <th className="p-3 border">Check-Out</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>

          <tbody>
            {filterVisitor.map((visitor) => {
              let statusBadge;

              if (visitor.status === "rejected") {
                statusBadge = (
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                    Rejected
                  </span>
                );
              } else if (visitor.checkOutTime) {
                statusBadge = (
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                    Checked Out
                  </span>
                );
              } else if (visitor.status === "approved" && visitor.checkInTime) {
                statusBadge = (
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">
                    Inside
                  </span>
                );
              } else if (visitor.status === "approved") {
                statusBadge = (
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm">
                    Approved
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                    Pending Approval
                  </span>
                );
              }

              return (
                <tr key={visitor._id} className="text-center">
                  <td className="border p-2">{visitor.name}</td>
                  <td className="border p-2">{visitor.email}</td>
                  <td className="border p-2">{visitor.purpose}</td>
                  <td className="border p-2">{visitor.personToMeet}</td>

                  <td className="border p-2">
                    {visitor.checkInTime
                      ? new Date(visitor.checkInTime).toLocaleString("en-IN")
                      : "—"}
                  </td>

                  <td className="border p-2">
                    {visitor.status === "rejected"
                      ? "—"
                      : visitor.checkOutTime
                        ? new Date(visitor.checkOutTime).toLocaleString("en-IN")
                        : "—"}
                  </td>

                  <td className="border p-2">{statusBadge}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitorsPage;
