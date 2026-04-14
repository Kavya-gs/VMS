import { useCallback, useEffect, useState } from "react";
import API from "../../../../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import VisitorDashboard from "./VisitorDashboard";
import { useAuth } from "../../../../contexts/useAuth";

const DashboardPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({});

  const { role, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (role === "visitor") {
    return <VisitorDashboard />;
  }

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/visitors", { showLoader: false });
      setVisitors(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/visitors/stats", { showLoader: false });
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDashboardData = useCallback(() => {
    fetchVisitors();
    fetchStats();
  }, []);

  useEffect(() => {
    if (role !== "admin" && role !== "security") {
      return;
    }

    loadDashboardData();

    const handleWindowFocus = () => {
      loadDashboardData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadDashboardData();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [role, loadDashboardData]);

  const checkedOut = visitors.filter((v) => v.checkOutTime).length;
  const inside = visitors.filter((v) => !v.checkOutTime).length;
  const visitorsToday = visitors.filter((v) => {
    const checkInDate = new Date(v.checkInTime);
    const today = new Date();
    return checkInDate.toDateString() === today.toDateString();
  }).length;

  const chartData = [
    { name: "Inside", value: inside },
    { name: "Checked Out", value: checkedOut },
  ];

  const weeklyData = getWeeklyVisitorTrend(visitors);
  const thisWeekVisits = weeklyData.reduce((sum, day) => sum + day.value, 0);
  const previousWeekVisits = getPreviousWeekVisitorTrend(visitors);
  const busiestDay = weeklyData.reduce(
    (topDay, currentDay) => (currentDay.value > topDay.value ? currentDay : topDay),
    weeklyData[0] || { label: "", value: 0 }
  );

  const COLORS = ["#0d9e23", "#ef4444"];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 space-y-6 sm:space-y-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>

      {role === "admin" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Visitors Today" value={stats.visitorsToday} color="text-indigo-600" />
            <StatCard title="Total Visitors" value={stats.totalVisitors} color="text-teal-600" />
            <StatCard title="Visitors Inside" value={stats.visitorsInside} color="text-green-600" />
            <StatCard title="Checked Out Today" value={stats.checkedOutToday} color="text-red-600" />
          </div>

          <ChartSection
            chartData={chartData}
            COLORS={COLORS}
            weeklyData={weeklyData}
            thisWeekVisits={thisWeekVisits}
            previousWeekVisits={previousWeekVisits}
            busiestDay={busiestDay}
          />
        </>
      )}

      {role === "security" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Visitors Today" value={visitorsToday} color="text-indigo-600" />
            <StatCard title="Inside" value={inside} color="text-green-600" />
            <StatCard title="Checked Out" value={checkedOut} color="text-red-600" />
          </div>

          <ChartSection
            chartData={chartData}
            COLORS={COLORS}
            weeklyData={weeklyData}
            thisWeekVisits={thisWeekVisits}
            previousWeekVisits={previousWeekVisits}
            busiestDay={busiestDay}
          />
        </>
      )}

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
  <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 flex flex-col items-center text-center hover:shadow-lg transition">
    <h2 className="text-gray-500 text-sm">{title}</h2>
    <p className={`text-2xl sm:text-3xl font-bold mt-2 ${color || ""}`}>
      {value || 0}
    </p>
  </div>
);

const ChartSection = ({
  chartData,
  COLORS,
  weeklyData,
  thisWeekVisits,
  previousWeekVisits,
  busiestDay,
}) => {
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const trendChange = previousWeekVisits === 0
    ? thisWeekVisits > 0
      ? 100
      : 0
    : Math.round(((thisWeekVisits - previousWeekVisits) / previousWeekVisits) * 100);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400" />
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-sky-100/60 blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Live snapshot
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900">
              Visitor Status Overview
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              A quick read on who is inside, who has checked out, and how this week compares with the last one.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            {total || 0} total visits tracked
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Inside", value: chartData[0]?.value || 0, tone: COLORS[0] },
                { label: "Checked out", value: chartData[1]?.value || 0, tone: COLORS[1] },
                { label: "This week", value: thisWeekVisits, tone: "#0f172a" },
                { label: "Last week", value: previousWeekVisits, tone: "#64748b" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.tone }}
                    />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Week trend
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {trendChange > 0 ? "+" : ""}{trendChange}% vs last week
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Based on visitors created in the last 7 days.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Busiest day
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {busiestDay?.label || "No data"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {busiestDay?.value || 0} check-ins recorded that day.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Last 7 days</p>
                <p className="text-xs text-slate-500">Check-ins by day</p>
              </div>

              <div className="mt-4 space-y-3">
                {weeklyData.map((day) => {
                  const maxValue = Math.max(...weeklyData.map((entry) => entry.value), 1);
                  const width = day.value === 0 ? 0 : Math.max(10, (day.value / maxValue) * 100);

                  return (
                    <div key={day.label} className="grid grid-cols-[52px_minmax(0,1fr)_28px] items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {day.label}
                      </span>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-right text-sm font-semibold text-slate-700">
                        {day.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[320px] rounded-[24px] border border-slate-200 bg-white px-3 py-5 text-slate-900 shadow-sm">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white via-slate-50 to-sky-50" />
            <div className="relative">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Overview chart
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Inside vs checked out
                  </p>
                </div>
                <div className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs text-sky-700">
                  Today
                </div>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={92}
                    innerRadius={60}
                    paddingAngle={4}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 40px rgba(15, 23, 42, 0.10)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-1 grid grid-cols-2 gap-3 px-2 text-xs text-slate-600">
                {chartData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 border border-slate-200">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p>{item.value} visitors</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const getDayLabel = (date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

const getStartOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getWeeklyVisitorTrend = (visitors) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const start = getStartOfDay(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const value = visitors.filter((visitor) => {
      const checkInDate = new Date(visitor.checkInTime);
      return checkInDate >= start && checkInDate < end;
    }).length;

    return {
      label: getDayLabel(date),
      value,
    };
  });

  return days;
};

const getPreviousWeekVisitorTrend = (visitors) => {
  const today = new Date();
  const end = getStartOfDay(today);
  const start = new Date(end);
  start.setDate(end.getDate() - 14);
  const middle = new Date(end);
  middle.setDate(end.getDate() - 7);

  return visitors.filter((visitor) => {
    const checkInDate = new Date(visitor.checkInTime);
    return checkInDate >= start && checkInDate < middle;
  }).length;
};

export default DashboardPage;