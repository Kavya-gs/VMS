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

const DashboardPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchVisitors();
  }, []);

  useEffect(() => {
    const fetchStats = async() => {
      try {
        const res = await API.get("/visitors/stats");
        setStats(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  },[]);

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/visitors");
      setVisitors(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // stats
  const totalVisitors = visitors.length;
  const checkedOut = visitors.filter(v => v.checkOutTime).length;
  const inside = visitors.filter(v => !v.checkOutTime).length;

  const chartData = [
    { name: "Inside", value: inside },
    { name: "Checked Out", value: checkedOut },
  ];
  const COLORS = ["#22c55e", "#ef4444"]; 

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white shadow rounded p-6 text-center">
          <h2 className="text-gray-500">Visitors Today</h2>
          <p className="text-3xl font-bold text-red-600">{stats.visitorsToday}</p>
        </div>

        <div className="bg-white shadow rounded p-6 text-center">
          <h2 className="text-gray-500">Total Visitors</h2>
          <p className="text-3xl font-bold">{stats.totalVisitors}</p>
        </div>

        <div className="bg-white shadow rounded p-6 text-center">
          <h2 className="text-gray-500">Visitors Inside</h2>
          <p className="text-3xl font-bold text-green-600">{stats.visitorsInside}</p>
        </div>

        <div className="bg-white shadow rounded p-6 text-center">
          <h2 className="text-gray-500">Checked Out Today</h2>
          <p className="text-3xl font-bold text-red-600">{stats.checkedOutToday}</p>
        </div>
        

      </div>
      <div className="bg-white shadow rounded p-6">

      <h2 className="text-lg font-semibold mb-4">
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
          <Cell key={`cell-${index}`} fill={COLORS[index]} />
        ))}
      </Pie>

      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
  </div>
</div>
  );
};

export default DashboardPage;