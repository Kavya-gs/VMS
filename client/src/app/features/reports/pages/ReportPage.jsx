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
    // Fix double API call 
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchReports();

    intervalRef.current = setInterval(() => {
      fetchReports();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both dates");
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    fetchReports();
    toast.success("Data fetched successfully");
  };

  //filter {today, last 7 days}
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
  }

  const exportCSV = () => {
    const headers = ["Name", "Email", "Purpose", "Status"];

    const rows = visitors.map((v) => [
      v.name,
      v.email,
      v.purpose,
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

    const tableColumn = ["Name", "Email", "Purpose", "Status"];
    const tableRows = [];

    visitors.forEach((v) => {
      tableRows.push([v.name, v.email, v.purpose, v.status]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("visitors_report.pdf");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports Dashboard</h1>

        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            Export CSV
          </button>

          <button
            onClick={exportPDF}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={handleFilter}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Filter
        </button>

        <button
          onClick={setToday}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Today
        </button>

        <button
          onClick={setLast7Days}
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
          Last 7 Days
        </button>

        <button
          onClick={clearfilter}
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
      </div>

      {/* DATA */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : visitors.length === 0 ? (
        <p className="text-center text-gray-500">No data found</p>
      ) : (
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4">
            Visitor Details ({visitors.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {visitors.map((v) => (
                  <tr key={v._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{v.name}</td>
                    <td className="p-3">{v.email}</td>
                    <td className="p-3">{v.purpose}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          v.status === "approved"
                            ? "bg-green-100 text-green-600"
                            : v.status === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;