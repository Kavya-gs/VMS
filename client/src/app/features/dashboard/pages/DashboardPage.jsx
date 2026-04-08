import { useEffect, useState } from "react";
import API from "../../../../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import VisitorDashboard from "./VisitorDashboard";

const DashboardPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({});

  const role = localStorage.getItem("role") || "visitor";

  if (role === "visitor") {
    return <VisitorDashboard />;
  }

  useEffect(() => {
    if (role === "admin" || role === "security") {
      fetchVisitors();
      fetchStats();

      const interval = setInterval(() => {
        fetchVisitors();
        fetchStats();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/visitors");
      setVisitors(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/visitors/stats");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const checkedOut = visitors.filter(v => v.checkOutTime).length;
  const inside = visitors.filter(v => !v.checkOutTime).length;
  const visitorsToday = visitors.filter(v => {
    const checkInDate = new Date(v.checkInTime);
    const today = new Date();
    return checkInDate.toDateString() === today.toDateString();
  }).length;

  const chartData = [
    { name: "Inside", value: inside },
    { name: "Checked Out", value: checkedOut },
  ];

  const COLORS = ["#3b82f6", "#ef4444"]; // theme blue and red

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Admin Role */}
      {role === "admin" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Visitors Today" value={stats.visitorsToday} color="text-indigo-600" />
            <StatCard title="Total Visitors" value={stats.totalVisitors} color="text-teal-500" />
            <StatCard title="Visitors Inside" value={stats.visitorsInside} color="text-green-600" />
            <StatCard title="Checked Out Today" value={stats.checkedOutToday} color="text-red-600" />
          </div>

          <ChartSection chartData={chartData} COLORS={COLORS} />
        </>
      )}

      {/* Security Role */}
      {role === "security" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Visitors Today" value={visitorsToday} color="text-indigo-600" />
            <StatCard title="Inside" value={inside} color="text-green-600" />
            <StatCard title="Checked Out" value={checkedOut} color="text-red-600" />
          </div>

          <ChartSection chartData={chartData} COLORS={COLORS} />
        </>
      )}

      {/* Visitor Role */}
      {role === "visitor" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-xl p-6 text-center hover:shadow-lg transition">
            <h2 className="text-gray-500 text-lg">Request Visit</h2>
            <p className="text-sm text-gray-400 mt-2">
              Go to Check-In to request a visit
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl p-6 text-center hover:shadow-lg transition">
            <h2 className="text-gray-500 text-lg">My Status</h2>
            <p className="text-lg font-bold text-yellow-600 mt-2">
              Pending / Approved
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="bg-white shadow-md rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition">
    <h2 className="text-gray-500 text-sm">{title}</h2>
    <p className={`text-3xl font-bold mt-2 ${color || ""}`}>
      {value || 0}
    </p>
  </div>
);

const ChartSection = ({ chartData, COLORS }) => (
  <div className="bg-white shadow-md rounded-xl p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-700">
      Visitor Status Overview
    </h2>

    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={60}
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default DashboardPage;