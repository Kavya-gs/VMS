import { useEffect, useState } from "react";
import API from "../../../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ReportPage = () => {

  const [visitors, setVisitors] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await API.get("/visitors");
      const data = res.data;

      setVisitors(data);

      const total = data.length;

      const today = data.filter(v =>
        new Date(v.createdAt).toDateString() === new Date().toDateString()
      ).length;

      const checkedIn = data.filter(v =>
        v.status === "approved" && !v.checkOutTime
      ).length;

      const checkedOut = data.filter(v =>
        v.checkOutTime
      ).length;

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // CSV EXPORT
  const exportCSV = () => {
    const headers = ["Name", "Email", "Purpose", "Status"];

    const rows = visitors.map(v => [
      v.name,
      v.email,
      v.purpose,
      v.status
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "visitors_report.csv";
    link.click();
  };

  // PDF EXPORT
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Visitor Report", 14, 10);

    const tableColumn = ["Name", "Email", "Purpose", "Status"];
    const tableRows = [];

    visitors.forEach(v => {
      tableRows.push([
        v.name,
        v.email,
        v.purpose,
        v.status
      ]);
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

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4">Visitor Details</h2>

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
                <tr key={v._id} className="border-t">
                  <td className="p-3">{v.name}</td>
                  <td className="p-3">{v.email}</td>
                  <td className="p-3">{v.purpose}</td>
                  <td className="p-3 capitalize">{v.status}</td>
                </tr>
              ))}
            </tbody>
            
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;