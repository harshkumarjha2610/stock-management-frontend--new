"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search, TrendingUp, ShoppingBag, BadgeIndianRupee,
  CalendarDays, ChevronDown, X, Printer, Eye, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PaymentMethod = "Cash" | "UPI" | "Card";
type FilterTab     = "All" | "Day" | "Month" | "Customer" | "Product";

type SaleItem = {
  productId:   string;
  productName: string;
  quantity:    number;
  rate:        number;
  gstPercent:  number;
  gstAmount:   number;
  total:       number;
};

type Sale = {
  invoiceNumber:  string;
  customerName:   string;
  customerPhone:  string;
  items:          SaleItem[];
  subTotal:       number;
  gstAmount:      number;
  discount:       number;
  finalTotal:     number;
  paymentMethod:  PaymentMethod;
  createdAt:      string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

const pmColor: Record<PaymentMethod, string> = {
  Cash: "bg-mint-light text-success",
  UPI:  "bg-coral-light text-red-700",
  Card: "bg-purple-50 text-purple-700",
};

const tabs: FilterTab[] = ["All", "Day", "Month", "Customer", "Product"];

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function SalesPage() {
  const [allSales, setAllSales]         = useState<Sale[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function fetchSales() {
      try {
        setLoading(true);
        const res = await api.get('/bills');
        setAllSales(res.data.map((b: any) => ({
          invoiceNumber: b.invoice_no,
          customerName: b.customer?.name || "Walk-in",
          customerPhone: b.customer?.phone || "—",
          items: b.items?.map((i: any) => ({
            productId: i.product_id,
            productName: i.product?.name || "Unknown",
            quantity: i.quantity,
            rate: parseFloat(i.unit_price),
            gstPercent: parseFloat(i.gst_percent || 0),
            gstAmount: parseFloat(i.gst_amount || 0),
            total: parseFloat(i.total_price)
          })) || [],
          subTotal: parseFloat(b.subtotal),
          gstAmount: parseFloat(b.total_gst || 0),
          discount: parseFloat(b.total_discount || 0),
          finalTotal: parseFloat(b.total_amount),
          paymentMethod: (b.payment_method || "Cash") as PaymentMethod,
          createdAt: b.createdAt?.split('T')[0]
        })));
      } catch (error) {
        console.error("Failed to fetch sales", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  const [search, setSearch]             = useState("");
  const [activeTab, setActiveTab]       = useState<FilterTab>("All");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [pmFilter, setPmFilter]         = useState("All");
  const [viewSale, setViewSale]         = useState<Sale | null>(null);

  // ── Filtered Sales ──
  const filtered = useMemo(() => {
    return allSales.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.invoiceNumber.toLowerCase().includes(q)  ||
        s.customerName.toLowerCase().includes(q)   ||
        s.customerPhone.includes(q)                ||
        s.items.some((i) => i.productName.toLowerCase().includes(q));

      const matchPm   = pmFilter === "All" || s.paymentMethod === pmFilter;
      const matchFrom = !dateFrom || s.createdAt >= dateFrom;
      const matchTo   = !dateTo   || s.createdAt <= dateTo;

      return matchSearch && matchPm && matchFrom && matchTo;
    });
  }, [allSales, search, pmFilter, dateFrom, dateTo]);

  // ── Summary Stats (on filtered) ──
  const totalRevenue  = filtered.reduce((s, b) => s + b.finalTotal, 0);
  const totalGST      = filtered.reduce((s, b) => s + b.gstAmount, 0);
  const totalDiscount = filtered.reduce((s, b) => s + b.discount, 0);
  const totalBills    = filtered.length;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-secondary">Loading sales report...</p>
        </div>
      </div>
    );
  }

  // ── Day-wise Breakdown ──
  const dayWise = useMemo(() => {
    const map: Record<string, { date: string; bills: number; revenue: number; gst: number }> = {};
    filtered.forEach((s) => {
      if (!map[s.createdAt]) map[s.createdAt] = { date: s.createdAt, bills: 0, revenue: 0, gst: 0 };
      map[s.createdAt].bills++;
      map[s.createdAt].revenue += s.finalTotal;
      map[s.createdAt].gst     += s.gstAmount;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  // ── Month-wise Breakdown ──
  const monthWise = useMemo(() => {
    const map: Record<string, { month: string; bills: number; revenue: number; gst: number }> = {};
    filtered.forEach((s) => {
      const month = s.createdAt.slice(0, 7); // "YYYY-MM"
      if (!map[month]) map[month] = { month, bills: 0, revenue: 0, gst: 0 };
      map[month].bills++;
      map[month].revenue += s.finalTotal;
      map[month].gst     += s.gstAmount;
    });
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  }, [filtered]);

  // ── Customer-wise Breakdown ──
  const customerWise = useMemo(() => {
    const map: Record<string, { name: string; phone: string; bills: number; spent: number }> = {};
    filtered.forEach((s) => {
      const key = s.customerPhone || s.customerName;
      if (!map[key]) map[key] = { name: s.customerName, phone: s.customerPhone, bills: 0, spent: 0 };
      map[key].bills++;
      map[key].spent += s.finalTotal;
    });
    return Object.values(map).sort((a, b) => b.spent - a.spent);
  }, [filtered]);

  // ── Product-wise Breakdown ──
  const productWise = useMemo(() => {
    const map: Record<string, { productId: string; name: string; qtySold: number; revenue: number; gst: number }> = {};
    filtered.forEach((s) =>
      s.items.forEach((item) => {
        if (!map[item.productId])
          map[item.productId] = { productId: item.productId, name: item.productName, qtySold: 0, revenue: 0, gst: 0 };
        map[item.productId].qtySold  += item.quantity;
        map[item.productId].revenue  += item.total;
        map[item.productId].gst      += item.gstAmount;
      })
    );
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  function clearFilters() {
    setSearch(""); setDateFrom(""); setDateTo(""); setPmFilter("All");
  }

  const hasFilters = search || dateFrom || dateTo || pmFilter !== "All";

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Sales Report</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track revenue, GST, and customer purchases</p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",   value: fmt(totalRevenue),  icon: BadgeIndianRupee, sub: "Gross sales" },
          { label: "Total Invoices",  value: totalBills,          icon: ShoppingBag,      sub: "Completed orders" },
          { label: "Total GST",       value: fmt(totalGST),       icon: TrendingUp,       sub: "Tax collected" },
          { label: "Total Discounts", value: fmt(totalDiscount),  icon: CalendarDays,     sub: "Savings applied" },
        ].map((s, i) => (
          <div key={s.label} className={`kpi-card kpi-${(i % 4) + 9}`}>
            <div className="kpi-icon-box">
              <s.icon className="w-5 h-5" />
            </div>
            <p className="kpi-value">{s.value}</p>
            <p className="kpi-label">{s.label}</p>
            <p className="kpi-sub">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by invoice, customer, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-background border border-border rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide px-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40 h-10 bg-background border border-border rounded-lg px-3 text-sm focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide px-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40 h-10 bg-background border border-border rounded-lg px-3 text-sm focus:outline-none"
            />
          </div>

          {/* Payment Method */}
          <div className="relative self-end">
            <select
              value={pmFilter}
              onChange={(e) => setPmFilter(e.target.value)}
              className="w-36 h-10 bg-background border border-border rounded-lg px-3 text-sm focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {["All", "Cash", "UPI", "Card"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="self-end flex items-center gap-1.5 h-10 px-4 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-background hover:text-coral transition-colors whitespace-nowrap"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div className="flex gap-1 bg-background rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-surface text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab === "All"      && "All Invoices"}
            {tab === "Day"      && "Day-wise"}
            {tab === "Month"    && "Monthly"}
            {tab === "Customer" && "By Customer"}
            {tab === "Product"  && "By Product"}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          TAB: ALL INVOICES
      ════════════════════════════════════════════════════ */}
      {activeTab === "All" && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Invoice No", "Customer", "Phone", "Items", "Subtotal", "GST", "Discount", "Total", "Payment", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-text-secondary">
                        <TrendingUp size={32} className="text-slate-300" />
                        <p className="text-sm font-medium">No sales found</p>
                        <p className="text-xs">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => (
                    <tr key={sale.invoiceNumber} className="border-b border-slate-50 hover:bg-background transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-primary font-semibold whitespace-nowrap">
                        {sale.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-text-primary whitespace-nowrap">{sale.customerName}</td>
                      <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">{sale.customerPhone || "—"}</td>
                      <td className="px-4 py-3.5 text-text-primary">{sale.items.length}</td>
                      <td className="px-4 py-3.5 text-text-primary whitespace-nowrap">{fmt(sale.subTotal)}</td>
                      <td className="px-4 py-3.5 text-text-primary whitespace-nowrap">{fmt(sale.gstAmount)}</td>
                      <td className="px-4 py-3.5 text-success whitespace-nowrap">
                        {sale.discount > 0 ? `− ${fmt(sale.discount)}` : "—"}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-text-primary whitespace-nowrap">{fmt(sale.finalTotal)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${pmColor[sale.paymentMethod]}`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary text-xs whitespace-nowrap">{sale.createdAt}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => setViewSale(sale)}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-red-800 transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-background flex justify-between items-center">
              <p className="text-xs text-text-secondary">
                Showing <span className="font-semibold text-text-primary">{filtered.length}</span> of{" "}
                <span className="font-semibold text-text-primary">{allSales.length}</span> invoices
              </p>
              <p className="text-xs font-semibold text-text-primary">
                Total: <span className="text-primary">{fmt(totalRevenue)}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: DAY-WISE
      ════════════════════════════════════════════════════ */}
      {activeTab === "Day" && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Date", "Total Bills", "GST Collected", "Revenue"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayWise.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center text-sm text-text-secondary">No data for selected filters</td>
                  </tr>
                ) : (
                  dayWise.map((d) => (
                    <tr key={d.date} className="border-b border-slate-50 hover:bg-background transition-colors">
                      <td className="px-5 py-3.5 font-medium text-text-primary">{d.date}</td>
                      <td className="px-5 py-3.5 text-text-primary">
                        <span className="px-2.5 py-0.5 rounded-full bg-coral-light text-red-700 text-xs font-semibold">
                          {d.bills} bill{d.bills !== 1 && "s"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-primary">{fmt(d.gst)}</td>
                      <td className="px-5 py-3.5 font-bold text-text-primary">{fmt(d.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {dayWise.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-background flex justify-between">
              <p className="text-xs text-text-secondary">{dayWise.length} days</p>
              <p className="text-xs font-semibold text-primary">{fmt(totalRevenue)}</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: MONTHLY
      ════════════════════════════════════════════════════ */}
      {activeTab === "Month" && (
        <div className="space-y-4">
          {/* Details Panel */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-text-primary mb-5">Monthly Revenue</h3>
            {monthWise.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-8">No data for selected filters</p>
            ) : (
              (() => {
                const maxRev = Math.max(...monthWise.map((m) => m.revenue));
                return (
                  <div className="flex items-end gap-4 h-36">
                    {[...monthWise].reverse().map((m) => (
                      <div key={m.month} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-text-secondary truncate">
                          {fmt(m.revenue)}
                        </span>
                        <div
                          className="w-full rounded-t-md bg-primary hover:bg-red-700 transition-colors cursor-default"
                          style={{ height: `${Math.max(8, (m.revenue / maxRev) * 100)}%` }}
                          title={`${m.month}: ${fmt(m.revenue)}`}
                        />
                        <span className="text-xs text-text-secondary truncate">
                          {new Date(m.month + "-01").toLocaleString("en-IN", { month: "short", year: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          {/* ── Recent Sales Table ── */}
          <div className="glass-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    {["Month", "Total Bills", "GST Collected", "Revenue"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthWise.map((m) => (
                    <tr key={m.month} className="border-b border-slate-50 hover:bg-background transition-colors">
                      <td className="px-5 py-3.5 font-medium text-text-primary">
                        {new Date(m.month + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-text-primary">
                        <span className="px-2.5 py-0.5 rounded-full bg-coral-light text-red-700 text-xs font-semibold">
                          {m.bills} bill{m.bills !== 1 && "s"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-primary">{fmt(m.gst)}</td>
                      <td className="px-5 py-3.5 font-bold text-text-primary">{fmt(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: BY CUSTOMER
      ════════════════════════════════════════════════════ */}
      {activeTab === "Customer" && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["#", "Customer Name", "Phone", "Total Bills", "Total Spent"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customerWise.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center text-sm text-text-secondary">No data for selected filters</td>
                  </tr>
                ) : (
                  customerWise.map((c, idx) => (
                    <tr key={c.phone || c.name} className="border-b border-slate-50 hover:bg-background transition-colors">
                      <td className="px-5 py-3.5 text-text-secondary text-xs font-semibold">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-text-primary">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary">{c.phone || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-coral-light text-red-700 text-xs font-semibold">
                          {c.bills} bill{c.bills !== 1 && "s"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-text-primary">{fmt(c.spent)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {customerWise.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-background flex justify-between">
              <p className="text-xs text-text-secondary">{customerWise.length} customers</p>
              <p className="text-xs font-semibold text-primary">{fmt(totalRevenue)} total</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: BY PRODUCT
      ════════════════════════════════════════════════════ */}
      {activeTab === "Product" && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["#", "Product ID", "Product Name", "Qty Sold", "GST Collected", "Revenue"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productWise.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-text-secondary">No data for selected filters</td>
                  </tr>
                ) : (
                  productWise.map((p, idx) => (
                    <tr key={p.productId} className="border-b border-slate-50 hover:bg-background transition-colors">
                      <td className="px-5 py-3.5 text-text-secondary text-xs font-semibold">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">{p.productId}</td>
                      <td className="px-5 py-3.5 font-semibold text-text-primary">{p.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-mint-light text-success text-xs font-semibold">
                          {p.qtySold} units
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-primary">{fmt(p.gst)}</td>
                      <td className="px-5 py-3.5 font-bold text-text-primary">{fmt(p.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {productWise.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-background flex justify-between">
              <p className="text-xs text-text-secondary">{productWise.length} products sold</p>
              <p className="text-xs font-semibold text-primary">{fmt(totalRevenue)} total</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          VIEW SALE MODAL
      ════════════════════════════════════════════════════ */}
      {viewSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-text-primary">Invoice Details</h2>
                <p className="text-xs font-mono text-primary mt-0.5">{viewSale.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setViewSale(null)}
                className="w-8 h-8 rounded-lg hover:bg-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Customer"   value={viewSale.customerName} />
                <InfoRow label="Phone"      value={viewSale.customerPhone || "—"} />
                <InfoRow label="Date"       value={viewSale.createdAt} />
                <InfoRow label="Payment"    value={
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pmColor[viewSale.paymentMethod]}`}>
                    {viewSale.paymentMethod}
                  </span>
                } />
              </div>

              {/* Items */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="px-3 py-2 text-left text-text-secondary font-semibold">Product</th>
                      <th className="px-3 py-2 text-right text-text-secondary font-semibold">Qty × Rate</th>
                      <th className="px-3 py-2 text-right text-text-secondary font-semibold">GST</th>
                      <th className="px-3 py-2 text-right text-text-secondary font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewSale.items.map((item) => (
                      <tr key={item.productId} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2.5 text-text-primary font-medium">{item.productName}</td>
                        <td className="px-3 py-2.5 text-right text-text-secondary">{item.quantity} × {fmt(item.rate)}</td>
                        <td className="px-3 py-2.5 text-right text-text-secondary">{fmt(item.gstAmount)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-text-primary">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <SummaryRow label="Subtotal"    value={fmt(viewSale.subTotal)}  />
                <SummaryRow label="GST Total"   value={fmt(viewSale.gstAmount)} />
                {viewSale.discount > 0 && (
                  <SummaryRow label="Discount"  value={`− ${fmt(viewSale.discount)}`} valueClass="text-success font-semibold" />
                )}
                <div className="border-t border-border pt-2">
                  <SummaryRow
                    label="Total Paid"
                    value={fmt(viewSale.finalTotal)}
                    labelClass="font-bold text-text-primary"
                    valueClass="text-lg font-bold text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setViewSale(null)}
                className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────────
function SummaryRow({
  label, value,
  labelClass = "text-text-secondary",
  valueClass = "font-semibold text-text-primary",
}: {
  label: string;
  value: string;
  labelClass?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${labelClass}`}>{label}</span>
      <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-secondary font-medium">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-colors";