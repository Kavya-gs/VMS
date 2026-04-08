import { useEffect, useState, useRef } from "react";
import API from "../../../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

const ReportPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const hasFetched = useRef(false);
  const intervalRef = useRef(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let res;

      if (startDate && endDate) {
        res = await API.get("/visitors/reports", {
          params: { startDate, endDate },
        });
      } else {
        res = await API.get("/visitors");
      }

      setVisitors(res.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (startDate && endDate) fetchReports();
  }, [startDate, endDate]);

  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both dates");
      return;
    }
    fetchReports();
    toast.success("Data fetched successfully");
  };

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
  };

  const setLast7Days = () => {
    const today = new Date();
    const last7 = new Date();
    last7.setDate(today.getDate() - 7);

    setStartDate(last7.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const clearfilter = () => {
    setStartDate("");
    setEndDate("");
    fetchReports();
  };

  const exportCSV = () => {
    const headers = ["S.No", "Name", "Email", "Purpose", "Check In Time", "Check Out Time", "Status"];
    const rows = visitors.map((v, index) => [
      index + 1,
      v.name,
      v.email,
      v.purpose,
      v.checkInTime ? new Date(v.checkInTime).toLocaleString("en-GB") : "-",
      v.checkOutTime ? new Date(v.checkOutTime).toLocaleString("en-GB") : "-",
      v.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "visitors_report.csv";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Visitor Report", 14, 10);

    const tableColumn = ["S.No", "Name", "Email", "Purpose", "Check In Time", "Check Out Time", "Status"];
    const tableRows = visitors.map((v, index) => [
      index + 1,
      v.name,
      v.email,
      v.purpose,
      v.checkInTime ? new Date(v.checkInTime).toLocaleString("en-GB") : "-",
      v.checkOutTime ? new Date(v.checkOutTime).toLocaleString("en-GB") : "-",
      v.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("visitors_report.pdf");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Reports Dashboard</h1>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportCSV}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-5 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
          >
            Export CSV
          </button>

          <button
            onClick={exportPDF}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-5 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
        />

        <button
          onClick={handleFilter}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold px-5 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
        >
          Filter
        </button>

        <button
          onClick={setToday}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-5 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
        >
          Today
        </button>

        <button
          onClick={setLast7Days}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold px-5 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
        >
          Last 7 Days
        </button>

        <button
          onClick={clearfilter}
          className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold px-5 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
        >
          Clear
        </button>
      </div>

      {/* DATA */}
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : visitors.length === 0 ? (
        <p className="text-center text-gray-500">No data found</p>
      ) : (
        <div className="bg-white rounded-xl shadow p-5 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Visitor Details ({visitors.length})
          </h2>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3">S.No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Check In</th>
                <th className="p-3">Check Out</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {visitors.map((v, index) => (
                <tr key={v._id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{v.name}</td>
                  <td className="p-3">{v.email}</td>
                  <td className="p-3">{v.purpose}</td>
                  <td className="p-3">{v.checkInTime ? new Date(v.checkInTime).toLocaleString("en-GB") : "—"}</td>
                  <td className="p-3">{v.checkOutTime ? new Date(v.checkOutTime).toLocaleString("en-GB") : "—"}</td>
                  <td className="p-3">{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportPage;