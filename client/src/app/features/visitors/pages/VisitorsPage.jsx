import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../../services/api";
import { useDebounce } from "../../../../hooks/useDebounce";

const VisitorsPage = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchVisitors = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearchTerm,
        status: statusFilter,
      };
      const res = await API.get("/visitors", { params });
      setVisitors(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalVisitors(res.data.pagination.total);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchVisitors(1); // Reset to page 1 when filters change
  }, [debouncedSearchTerm, statusFilter]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchVisitors(page);
    }
  };

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

      <div className="mb-4 text-sm text-gray-600">
        Total Visitors: {totalVisitors}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Purpose</th>
                  <th className="p-3 border">Person To Meet</th>
                  <th className="p-3 border">Check-In Type</th>
                  <th className="p-3 border">Check-In</th>
                  <th className="p-3 border">Check-Out</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">ID Card</th>
                </tr>
              </thead>

              <tbody>
                {visitors.map((visitor) => {
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

                  const checkInTypeLabel =
                    visitor.checkInType === "self"
                      ? "Self Checked In"
                      : "Manual Checked In";

                  return (
                    <tr key={visitor._id} className="text-center">
                      <td className="border p-2">{visitor.name}</td>
                      <td className="border p-2">{visitor.email}</td>
                      <td className="border p-2">{visitor.purpose}</td>
                      <td className="border p-2">{visitor.personToMeet}</td>
                      <td className="border p-2 text-xs text-slate-600 font-medium">{checkInTypeLabel}</td>

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
                      <td className="border p-2">
                        {visitor.temporaryCardId ? (
                          <button
                            onClick={() => navigate(`/visitor-card/${visitor._id}`)}
                            className="rounded px-3 py-1 bg-slate-900 text-white text-sm hover:bg-slate-800"
                          >
                            View / Download
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Not available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination  */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VisitorsPage;
