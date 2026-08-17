"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Package, Users, BadgeIndianRupee,
  ChevronDown, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";


// ─── Enhanced Color Palette ────────────────────────────────────────────────
const C = {
  primary: "#9B5CFF",
  primary2: "#C084FC",
  purpleGlow: "rgba(155, 92, 255, 0.35)",

  mint: "#14D9B5",
  mint2: "#63F5D2",
  mintGlow: "rgba(20, 217, 181, 0.30)",

  blue: "#3BA7FF",
  blue2: "#6DD5FF",
  blueGlow: "rgba(59, 167, 255, 0.30)",

  coral: "#FF7E8A",
  coral2: "#FFB199",
  coralGlow: "rgba(255, 126, 138, 0.28)",

  warning: "#FFC857",
  warning2: "#FFE08A",
  warningGlow: "rgba(255, 200, 87, 0.28)",

  grid: "rgba(140, 138, 149, 0.12)",
  textPrimary: "#2C2C34",
  textMuted: "#8C8A95",
};


// ─── Demo Sparklines ───────────────────────────────────────────────────────
const miniChartData = {
  revenue: [
    { value: 18 }, { value: 26 }, { value: 22 }, { value: 34 },
    { value: 30 }, { value: 44 }, { value: 38 }, { value: 52 },
  ],
  profit: [
    { value: 10 }, { value: 14 }, { value: 12 }, { value: 18 },
    { value: 16 }, { value: 24 }, { value: 21 }, { value: 29 },
  ],
  visitors: [
    { value: 35 }, { value: 42 }, { value: 40 }, { value: 48 },
    { value: 52 }, { value: 58 }, { value: 56 }, { value: 66 },
  ],
  stock: [
    { value: 42 }, { value: 39 }, { value: 37 }, { value: 34 },
    { value: 29 }, { value: 25 }, { value: 31 }, { value: 36 },
  ],
};


// ─── Colorful Mini Sparkline ───────────────────────────────────────────────
function MiniSparkline({
  data,
  color,
  color2,
  gradientId,
}: {
  data: { value: number }[];
  color: string;
  color2: string;
  gradientId: string;
}) {
  return (
    <div className="mt-4 h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color2} stopOpacity={0.04} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 5,
              fill: color,
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


// ─── Custom Tooltip ────────────────────────────────────────────────────────
function ChartTooltip({
  active, payload, label, prefix = "₹",
}: {
  active?: boolean;
  payload?: readonly any[];
  label?: any;
  prefix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl px-4 py-3 text-sm">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: p.color, boxShadow: `0 0 12px ${p.color}` }}
          />
          <span className="text-text-muted capitalize">{p.name}:</span>
          <span className="font-bold text-text-primary">
            {prefix !== ""
              ? `₹${Number(p.value || 0).toLocaleString("en-IN")}`
              : Number(p.value || 0).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}


function StockTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly any[];
  label?: any;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl px-4 py-3 text-sm">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }}
          />
          <span className="text-text-muted capitalize">{p.name}:</span>
          <span className="font-bold text-text-primary">{p.value} units</span>
        </div>
      ))}
    </div>
  );
}


// ─── Shared axis tick style ────────────────────────────────────────────────
const tickStyle = { fontSize: 11, fill: C.textMuted };


// ─── Card Wrapper ──────────────────────────────────────────────────────────
function ChartCard({
  title, subtitle, children, action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-[28px] p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 border border-white/10">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-28 h-28 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <h2 className="text-sm font-bold text-text-primary">{title}</h2>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}


// ─── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salesView, setSalesView] = useState<"daily" | "monthly">("daily");

  const [summary, setSummary] = useState<any>({
    today_sales: 0,
    today_profit: 0,
    total_products: 0,
    low_stock_count: 0,
    staff_present: 0,
    staff_total: 0,
    this_month_sales: 0,
    last_month_sales: 0,
    avg_margin: 0,
  });

  const [dailySalesData, setDailySalesData] = useState<any[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [gstSummary, setGstSummary] = useState<any>({ history: [], ytd_collected: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        const [
          statsRes,
          dailyRes,
          monthlyRes,
          stockRes,
          attendanceRes,
          gstRes,
        ] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/reports/daily-sales"),
          api.get("/reports/monthly-sales"),
          api.get("/reports/stock-overview"),
          api.get("/reports/attendance-stats"),
          api.get("/reports/gst-summary"),
        ]);

        setSummary(statsRes.data);
        setDailySalesData(dailyRes.data);
        setMonthlySalesData(monthlyRes.data);
        setStockData(stockRes.data);
        setAttendanceData(attendanceRes.data);
        setGstSummary(gstRes.data);
      } catch (error) {
        console.warn("Failed to fetch dashboard data, using mock data for UI visualization.");

        setSummary({
          today_sales: 45200,
          today_profit: 12500,
          total_products: 342,
          low_stock_count: 12,
          staff_present: 4,
          staff_total: 5,
          this_month_sales: 1250000,
          last_month_sales: 1100000,
          avg_margin: 28,
        });

        setDailySalesData(
          Array.from({ length: 14 }).map((_, i) => ({
            day: `Day ${i + 1}`,
            sales: Math.floor(Math.random() * 50000) + 10000,
            profit: Math.floor(Math.random() * 15000) + 3000,
          }))
        );

        setMonthlySalesData(
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
            month,
            sales: Math.floor(Math.random() * 800000) + 400000,
            profit: Math.floor(Math.random() * 200000) + 100000,
          }))
        );

        setStockData([
          { name: "Premium T-Shirt", stock: 120, reorderAt: 20 },
          { name: "Denim Jeans", stock: 15, reorderAt: 20 },
          { name: "Cotton Kurta", stock: 0, reorderAt: 10 },
          { name: "Summer Shorts", stock: 45, reorderAt: 15 },
          { name: "Winter Jacket", stock: 5, reorderAt: 10 },
        ]);

        setAttendanceData([
          { day: "Mon", present: 4, absent: 1 },
          { day: "Tue", present: 5, absent: 0 },
          { day: "Wed", present: 4, absent: 1 },
          { day: "Thu", present: 3, absent: 2 },
          { day: "Fri", present: 5, absent: 0 },
          { day: "Sat", present: 4, absent: 1 },
          { day: "Sun", present: 2, absent: 3 },
        ]);

        setGstSummary({
          ytd_collected: 185000,
          history: [
            { month: "Jan", collected: 22000, paid: 18000 },
            { month: "Feb", collected: 26000, paid: 21000 },
            { month: "Mar", collected: 31000, paid: 25000 },
            { month: "Apr", collected: 28000, paid: 23000 },
            { month: "May", collected: 36000, paid: 29000 },
            { month: "Jun", collected: 42000, paid: 33000 },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const isEnterprise = theme === "enterprise";

  const stats = isEnterprise
    ? [
      {
        label: "Today's Revenue",
        value: `₹${summary.today_sales.toLocaleString("en-IN")}`,
        sub: "Increased by 60%",
        icon: BadgeIndianRupee,
        iconColor: "text-primary",
        iconBg: "bg-primary-light",
        cardStyle: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,244,255,0.95))" },
        chartData: miniChartData.revenue,
        chartColor: C.primary,
        chartColor2: C.primary2,
        gradientId: "miniRevenueEnterprise",
      },
      {
        label: "Today's Profit",
        value: `₹${summary.today_profit.toLocaleString("en-IN")}`,
        sub: "Decreased by 10%",
        icon: TrendingUp,
        iconColor: "text-primary",
        iconBg: "bg-primary-light",
        cardStyle: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.95))" },
        chartData: miniChartData.profit,
        chartColor: C.blue,
        chartColor2: C.blue2,
        gradientId: "miniProfitEnterprise",
      },
      {
        label: "Visitors Online",
        value: "95,574",
        sub: "Increased by 5%",
        icon: Users,
        iconColor: "text-primary",
        iconBg: "bg-primary-light",
        cardStyle: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(236,255,250,0.95))" },
        chartData: miniChartData.visitors,
        chartColor: C.mint,
        chartColor2: C.mint2,
        gradientId: "miniVisitorsEnterprise",
      },
      {
        label: "Total Stock",
        value: summary.total_products.toString(),
        sub: "Active stock items",
        icon: Package,
        iconColor: "text-primary",
        iconBg: "bg-primary-light",
        cardStyle: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,244,246,0.95))" },
        chartData: miniChartData.stock,
        chartColor: C.coral,
        chartColor2: C.coral2,
        gradientId: "miniStockEnterprise",
      },
    ]
    : [
      {
        label: "Today's Revenue",
        value: `₹${summary.today_sales.toLocaleString("en-IN")}`,
        sub: "Increased by 60%",
        icon: BadgeIndianRupee,
        iconColor: "text-white",
        iconBg: "bg-white/20",
        cardStyle: {
          background: "linear-gradient(135deg, #9B5CFF 0%, #C084FC 100%)",
          boxShadow: `0 18px 40px ${C.purpleGlow}`,
        },
        chartData: miniChartData.revenue,
        chartColor: "#FFFFFF",
        chartColor2: "rgba(255,255,255,0.25)",
        gradientId: "miniRevenueDefault",
      },
      {
        label: "Today's Profit",
        value: `₹${summary.today_profit.toLocaleString("en-IN")}`,
        sub: "Decreased by 10%",
        icon: TrendingUp,
        iconColor: "text-white",
        iconBg: "bg-white/20",
        cardStyle: {
          background: "linear-gradient(135deg, #3BA7FF 0%, #6DD5FF 100%)",
          boxShadow: `0 18px 40px ${C.blueGlow}`,
        },
        chartData: miniChartData.profit,
        chartColor: "#FFFFFF",
        chartColor2: "rgba(255,255,255,0.25)",
        gradientId: "miniProfitDefault",
      },
      {
        label: "Visitors Online",
        value: "95,574",
        sub: "Increased by 5%",
        icon: Users,
        iconColor: "text-white",
        iconBg: "bg-white/20",
        cardStyle: {
          background: "linear-gradient(135deg, #14D9B5 0%, #63F5D2 100%)",
          boxShadow: `0 18px 40px ${C.mintGlow}`,
        },
        chartData: miniChartData.visitors,
        chartColor: "#FFFFFF",
        chartColor2: "rgba(255,255,255,0.25)",
        gradientId: "miniVisitorsDefault",
      },
      {
        label: "Total Stock",
        value: summary.total_products.toString(),
        sub: "Active stock items",
        icon: Package,
        iconColor: "text-white",
        iconBg: "bg-white/20",
        cardStyle: {
          background: "linear-gradient(135deg, #FF7E8A 0%, #FFB199 100%)",
          boxShadow: `0 18px 40px ${C.coralGlow}`,
        },
        chartData: miniChartData.stock,
        chartColor: "#FFFFFF",
        chartColor2: "rgba(255,255,255,0.25)",
        gradientId: "miniStockDefault",
      },
    ];

  const salesChartData = useMemo(() => {
    if (salesView === "daily") return dailySalesData;
    return monthlySalesData.map((item) => ({
      day: item.month,
      sales: item.sales,
      profit: item.profit,
    }));
  }, [salesView, dailySalesData, monthlySalesData]);

  const attendanceTotal = useMemo(() => {
    return attendanceData.reduce(
      (acc, day) => ({
        present: acc.present + (Number(day.present) || 0),
        absent: acc.absent + (Number(day.absent) || 0),
      }),
      { present: 0, absent: 0 }
    );
  }, [attendanceData]);

  const gstHistory = gstSummary?.history || [];

  const gstTotals = useMemo(() => {
    return gstHistory.reduce(
      (acc: { collected: number; paid: number }, row: any) => ({
        collected: acc.collected + (Number(row.collected) || 0),
        paid: acc.paid + (Number(row.paid) || 0),
      }),
      { collected: 0, paid: 0 }
    );
  }, [gstHistory]);

  const stockBarColors = stockData.map((item) =>
    item.stock === 0
      ? C.coral
      : item.stock <= item.reorderAt
        ? C.warning
        : C.mint
  );

  if (!mounted || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[42px] font-bold tracking-tight text-text-primary">
          Dashboard Overview
        </h1>
        <p className="text-base text-text-muted mt-2">
          Analytics and key metrics at a glance
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass-card rounded-[28px] p-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300"
            style={s.cardStyle}
          >
            <div className="absolute -top-10 -right-8 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute bottom-0 left-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />

            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${s.iconBg} mb-4 relative z-10 backdrop-blur-md`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>

            <p className={`text-3xl font-bold ${isEnterprise ? "text-text-primary" : "text-white"} relative z-10`}>
              {s.value}
            </p>
            <p className={`text-sm font-semibold ${isEnterprise ? "text-text-secondary" : "text-white/90"} mt-1 relative z-10`}>
              {s.label}
            </p>
            <p className={`text-xs ${isEnterprise ? "text-text-muted" : "text-white/80"} mt-0.5 relative z-10`}>
              {s.sub}
            </p>

            <div className="relative z-10">
              <MiniSparkline
                data={s.chartData}
                color={s.chartColor}
                color2={s.chartColor2}
                gradientId={s.gradientId}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sales Overview */}
      <ChartCard
        title="Sales Overview"
        subtitle={salesView === "daily" ? "Last 14 days" : "Last 6 months"}
        action={
          <div className="relative group">
            <select
              value={salesView}
              onChange={(e) => setSalesView(e.target.value as "daily" | "monthly")}
              className="h-8 pl-3 pr-8 rounded-md border border-border bg-surface text-xs font-semibold text-text-primary outline-none focus:border-primary appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.primary} stopOpacity={0.45} />
                <stop offset="100%" stopColor={C.primary2} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.coral} stopOpacity={0.40} />
                <stop offset="100%" stopColor={C.coral2} stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(155,92,255,0.25)", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              formatter={(v: string) => <span className="text-text-muted capitalize">{v}</span>}
            />

            <Area
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke={C.primary}
              strokeWidth={3.5}
              fill="url(#gradSales)"
              dot={false}
              activeDot={{ r: 6, fill: C.primary, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke={C.coral}
              strokeWidth={3.5}
              fill="url(#gradProfit)"
              dot={false}
              activeDot={{ r: 6, fill: C.coral, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Profit + Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Profit Breakdown" subtitle="Monthly profit — last 6 months">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
              <Bar dataKey="profit" name="Profit" fill={C.blue} radius={[10, 10, 0, 0]} />
              <Bar dataKey="sales" name="Sales" fill={C.primary} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border mt-2">
            {[
              { label: "This Month", value: `₹${(summary.this_month_sales || 0).toLocaleString("en-IN")}` },
              { label: "Last Month", value: `₹${(summary.last_month_sales || 0).toLocaleString("en-IN")}` },
              { label: "Avg Margin", value: `${summary.avg_margin || 0}%` },
            ].map((m) => (
              <div key={m.label} className="text-center rounded-2xl bg-white/40 backdrop-blur-md py-3">
                <p className="text-xs text-text-muted">{m.label}</p>
                <p className="text-sm font-bold text-text-primary mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Stock Overview"
          subtitle="Current units per product"
          action={
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-mint inline-block" /> OK</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Low</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-coral inline-block" /> OOS</span>
            </div>
          }
        >
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={stockData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                barSize={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                  tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 13) + "…" : v)}
                />
                <Tooltip content={<StockTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Bar dataKey="stock" name="Stock" radius={[0, 12, 12, 0]}>
                  {stockData.map((_, i) => (
                    <Cell key={i} fill={stockBarColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border mt-2">
            {[
              { label: "In Stock", value: stockData.filter((s) => s.stock > s.reorderAt).length, color: "text-mint" },
              { label: "Low Stock", value: stockData.filter((s) => s.stock > 0 && s.stock <= s.reorderAt).length, color: "text-warning" },
              { label: "Out of Stock", value: stockData.filter((s) => s.stock === 0).length, color: "text-coral" },
            ].map((m) => (
              <div key={m.label} className="text-center rounded-2xl bg-white/40 backdrop-blur-md py-3">
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Attendance + GST */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Staff Attendance"
          subtitle="Present vs absent across the last 7 days"
          action={
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-mint inline-block" /> Present</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-coral inline-block" /> Absent</span>
            </div>
          }
        >
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip content={<ChartTooltip prefix="" />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  formatter={(v: string) => <span className="text-text-muted capitalize">{v}</span>}
                />
                <Bar dataKey="present" name="Present" stackId="attendance" fill={C.mint} radius={[0, 0, 10, 10]} />
                <Bar dataKey="absent" name="Absent" stackId="attendance" fill={C.coral} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border mt-2">
            {[
              { label: "Present", value: attendanceTotal.present, color: "text-mint" },
              { label: "Absent", value: attendanceTotal.absent, color: "text-coral" },
              { label: "Active Staff", value: summary.staff_total || 0, color: "text-primary" },
            ].map((m) => (
              <div key={m.label} className="text-center rounded-2xl bg-white/40 backdrop-blur-md py-3">
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Monthly GST Summary"
          subtitle="GST collected and estimated paid by month"
          action={
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">YTD Collected</p>
              <p className="text-sm font-bold text-text-primary">₹{(gstSummary?.ytd_collected || 0).toLocaleString("en-IN")}</p>
            </div>
          }
        >
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={gstHistory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(59,167,255,0.30)", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  formatter={(v: string) => <span className="text-text-muted capitalize">{v}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  name="Collected"
                  stroke={C.primary}
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: C.primary, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: C.primary, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="paid"
                  name="Paid"
                  stroke={C.warning}
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: C.warning, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: C.warning, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border mt-2">
            {[
              { label: "Collected", value: `₹${gstTotals.collected.toLocaleString("en-IN")}`, color: "text-primary" },
              { label: "Paid", value: `₹${gstTotals.paid.toLocaleString("en-IN")}`, color: "text-warning" },
              { label: "Balance", value: `₹${(gstTotals.collected - gstTotals.paid).toLocaleString("en-IN")}`, color: "text-mint" },
            ].map((m) => (
              <div key={m.label} className="text-center rounded-2xl bg-white/40 backdrop-blur-md py-3">
                <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}