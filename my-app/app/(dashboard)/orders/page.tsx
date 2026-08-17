"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search, Eye, Trash2, X, ChevronDown, Filter,
  ShoppingCart, Clock, CheckCircle, XCircle, Truck,
  IndianRupee, CalendarDays, User, Phone, Package,
  ArrowUpDown, RefreshCw, Receipt, Loader2, Download, ChevronLeft, ChevronRight, ShoppingBag
} from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";
type PaymentStatus = "paid" | "unpaid" | "partial";
type PaymentMethod = "cash" | "upi" | "card";

type OrderItem = {
  productId:   string;
  name:        string;
  category?:   string;
  brand?:      string;
  sku?:        string;
  variant?:    string;
  qty:         number;
  rate:        number;
  gstPercent:  number;
  discount:    number;
};

type Order = {
  id:            string;
  invoiceNo:     string;
  customer:      string;
  phone:         string;
  items:         OrderItem[];
  subtotal:      number;
  totalDiscount: number;
  totalGST:      number;
  grandTotal:    number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status:        OrderStatus;
  createdAt:     string;
  updatedAt:     string;
  note:          string;
  billedBy:      string;
};

// Orders (Bills) are fetched from backend API

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const ORDER_STATUSES: { key: OrderStatus; label: string; color: string; bg: string; icon: React.ElementType }[] = [
  { key:"pending",   label:"Pending",   color:"text-warning",  bg:"bg-warning/10",  icon:Clock        },
  { key:"confirmed", label:"Confirmed", color:"text-red-700",   bg:"bg-coral-light",   icon:RefreshCw    },
  { key:"delivered", label:"Delivered", color:"text-success",  bg:"bg-mint-light",  icon:CheckCircle  },
  { key:"cancelled", label:"Cancelled", color:"text-primary",    bg:"bg-coral-light",    icon:XCircle      },
];

const PAYMENT_STATUSES: { key: PaymentStatus; label: string; color: string; bg: string }[] = [
  { key:"paid",    label:"Paid",    color:"text-success", bg:"bg-mint-light" },
  { key:"unpaid",  label:"Unpaid",  color:"text-primary",   bg:"bg-coral-light"   },
  { key:"partial", label:"Partial", color:"text-warning", bg:"bg-warning/10" },
];

const inputCls =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-red-400 focus:ring-2 focus:ring-primary transition-colors";

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function getOrderStatus(key: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.key === key)!;
}

function getPayStatus(key: PaymentStatus) {
  return PAYMENT_STATUSES.find((s) => s.key === key)!;
}

// ═══════════════════════════════════════════════════════════
// ORDER DETAIL MODAL
// ═══════════════════════════════════════════════════════════

function OrderDetailModal({
  order,
  onClose,
}: {
  order:          Order;
  onClose:        () => void;
}) {
  console.log("OrderDetailModal - Selected Order:", order);
  const orderSt = getOrderStatus(order.status);
  const paySt   = getPayStatus(order.paymentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-[80%] bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-text-primary">{order.invoiceNo}</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${orderSt.bg} ${orderSt.color}`}>
                <orderSt.icon size={11} />
                {orderSt.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${paySt.bg} ${paySt.color}`}>
                {paySt.label}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 font-mono">{order.id} · {order.createdAt}</p>
          </div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-primary-light text-text-secondary hover:text-primary flex items-center justify-center transition-all bg-background"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-2">Customer</p>
              <div className="flex items-center gap-2">
                <User size={14} className="text-text-secondary" />
                <p className="text-sm font-semibold text-text-primary">{order.customer || "Walk-in"}</p>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Phone size={14} className="text-text-secondary" />
                <p className="text-sm text-text-primary">{order.phone || "—"}</p>
              </div>
            </div>
            <div className="bg-background rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-2">Payment & Staff</p>
              <p className="text-sm font-semibold text-text-primary capitalize">{order.paymentMethod}</p>
              {order.billedBy && (
                <p className="text-xs text-text-secondary mt-1">
                  Billed By: <span className="font-semibold text-text-primary">{order.billedBy}</span>
                </p>
              )}
              <p className="text-xs text-text-secondary mt-1">Created: {order.createdAt}</p>
              <p className="text-xs text-text-secondary">Updated: {order.updatedAt}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-2">Order Items</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    {["Product","Qty","Rate","GST","Discount","Amount"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => {
                    const base    = item.rate * item.qty;
                    const disc    = item.discount * item.qty;
                    const taxable = base - disc;
                    const gst     = Math.round(taxable * item.gstPercent / 100);
                    const total   = taxable + gst;
                    return (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <p className="font-bold text-text-primary">{item.name}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                              {item.category && <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{item.category}</span>}
                              {item.brand && <span className="text-[10px] font-bold uppercase tracking-wider text-coral">· {item.brand}</span>}
                              {item.sku && <span className="text-[10px] font-mono text-text-secondary">· {item.sku}</span>}
                              {item.variant && <span className="text-[10px] font-semibold text-warning">· {item.variant}</span>}
                            </div>
                            <p className="text-[10px] text-slate-300 font-mono mt-1">ID: {item.productId}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-primary font-semibold tabular-nums text-base">{item.qty}</td>
                        <td className="px-4 py-3 text-text-primary tabular-nums">{fmt(item.rate)}</td>
                        <td className="px-4 py-3 text-warning tabular-nums text-xs font-bold">{item.gstPercent}%</td>
                        <td className="px-4 py-3 text-success tabular-nums font-medium">{disc > 0 ? fmt(disc) : "—"}</td>
                        <td className="px-4 py-3 font-bold text-text-primary tabular-nums text-base">{fmt(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="ml-auto w-64 space-y-2">
            {[
              { label:"Subtotal",        value: fmt(order.subtotal),       cls:"text-text-primary" },
              ...(order.totalDiscount > 0 ? [{ label:"Discount", value:`−${fmt(order.totalDiscount)}`, cls:"text-success" }] : []),
              { label:"GST",             value: fmt(order.totalGST),       cls:"text-warning" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">{r.label}</p>
                <p className={`text-xs font-semibold tabular-nums ${r.cls}`}>{r.value}</p>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <p className="text-sm font-bold text-text-primary">Grand Total</p>
              <p className="text-lg font-bold text-red-700 tabular-nums">{fmt(order.grandTotal)}</p>
            </div>
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-warning/10 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-warning mb-1">Note</p>
              <p className="text-sm text-amber-800">{order.note}</p>
            </div>
          )}


        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose}
            className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function OrdersPage() {
  const { theme } = useTheme();
  const isEnterprise = theme === "enterprise";

  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await api.get('/bills');
        console.log("FETCHED BILLS DATA:", res.data);
        setOrders(res.data.map((b: any) => ({
          id: b.id,
          invoiceNo: b.invoice_no,
          customer: b.customer?.name || "Walk-in",
          phone: b.customer?.phone || "—",
          items: b.items?.map((i: any) => ({
            productId: i.product_id,
            name: i.product?.name || "Unknown",
            category: i.product?.category,
            brand: i.product?.brand,
            sku: i.product?.sku,
            variant: i.size || i.product?.color || i.product?.hsn_code,
            qty: i.quantity,
            rate: parseFloat(i.unit_price),
            gstPercent: parseFloat(i.gst_percent || 0),
            discount: parseFloat(i.discount || 0)
          })) || [],
          subtotal: parseFloat(b.subtotal),
          totalDiscount: parseFloat(b.total_discount || 0),
          totalGST: parseFloat(b.total_gst || 0),
          grandTotal: parseFloat(b.total_amount),
          paymentMethod: (b.payment_method || "cash").toLowerCase() as PaymentMethod,
          paymentStatus: (b.payment_status || "paid").toLowerCase() as PaymentStatus,
          status: (b.status || "pending").toLowerCase() as OrderStatus,
          createdAt: b.createdAt?.replace('T',' ').slice(0, 16),
          updatedAt: b.updatedAt?.replace('T',' ').slice(0, 16),
          note: b.note || "",
          billedBy: b.billed_by || b.created_by || b.staff?.name || b.user?.name || b.billedBy || b.createdBy || ""
        })));
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("All");
  const [payF,       setPayF]       = useState("All");
  const [methodF,    setMethodF]    = useState("All");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [sortKey,    setSortKey]    = useState<"createdAt" | "grandTotal">("createdAt");
  const [sortDir,    setSortDir]    = useState<"asc" | "desc">("desc");
  const [viewing,    setViewing]    = useState<Order | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isEnterprise ? 15 : 10;

  // ── Stats ──
  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter((o) => o.status === "pending").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue:   orders.filter((o) => o.status !== "cancelled").reduce((t, o) => t + o.grandTotal, 0),
  }), [orders]);

  // ── Filter + Sort ──
  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
          String(o.customer).toLowerCase().includes(q) ||
          String(o.id).toLowerCase().includes(q) ||
          String(o.invoiceNo).toLowerCase().includes(q) ||
          String(o.phone).includes(q);
        const matchStatus = statusF === "All" || o.status === statusF;
        const matchPay    = payF    === "All" || o.paymentStatus === payF;
        const matchMethod = methodF === "All" || o.paymentMethod === methodF;
        const matchFrom   = !dateFrom || o.createdAt.slice(0, 10) >= dateFrom;
        const matchTo     = !dateTo   || o.createdAt.slice(0, 10) <= dateTo;
        return matchSearch && matchStatus && matchPay && matchMethod && matchFrom && matchTo;
      })
      .sort((a, b) => {
        const cmp = sortKey === "grandTotal"
          ? a.grandTotal - b.grandTotal
          : a.createdAt.localeCompare(b.createdAt);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [orders, search, statusF, payF, methodF, dateFrom, dateTo, sortKey, sortDir]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusF, payF, methodF, dateFrom, dateTo]);

  const paginatedOrders = useMemo(() => {
    if (!isEnterprise) return filtered; // In SaaS mode, maybe show all or standard pagination (we'll keep it untouched or just paginate all to be safe)
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize, isEnterprise]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function handleExportCSV() {
    const csvContent = [
      ["Order ID", "Customer", "Phone", "Amount", "Payment", "Status", "Date"].join(","),
      ...filtered.map(o => [
        o.invoiceNo,
        `"${o.customer}"`,
        o.phone,
        o.grandTotal,
        o.paymentStatus,
        o.status,
        o.createdAt
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }


  async function handleDelete(id: string) {
    setLoading(true);
    try {
      await api.delete(`/bills/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setDeleteId(null);
    } catch (error: any) {
      alert(error.message || "Failed to delete order");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch(""); setStatusF("All"); setPayF("All");
    setMethodF("All"); setDateFrom(""); setDateTo("");
  }

  const hasFilters = search || statusF !== "All" || payF !== "All" || methodF !== "All" || dateFrom || dateTo;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-secondary">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── View Modal ── */}
      {viewing && (
        <OrderDetailModal
          order={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-border p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-coral-light flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-coral" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Delete Order?</h3>
              <p className="text-sm text-text-secondary mt-1">This will permanently remove <span className="font-semibold font-mono text-text-primary">{deleteId}</span>. This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary text-sm font-semibold text-white transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Orders</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage all customer orders & invoices</p>
          </div>
          {isEnterprise && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total Orders",  value: stats.total,        sub: "All time",    icon: ShoppingBag },
            { label: "Pending",       value: stats.pending,      sub: "To process",  icon: Clock,        highlight: stats.pending > 0 },
            { label: "Delivered",     value: stats.delivered,    sub: "Completed",   icon: CheckCircle },
            { label: "Total Revenue", value: `₹${(stats.revenue/1000).toFixed(1)}K`, sub: "Excl. cancelled", icon: IndianRupee },
          ].map((k, i) => (
            <div key={k.label} className={`kpi-card kpi-${(i % 4) + 1} ${k.highlight ? "kpi-highlight" : ""}`}>
              <div className="kpi-icon-box">
                <k.icon className="w-5 h-5" />
              </div>
              <p className="kpi-value">{k.value}</p>
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="glass-panel p-4">
          <div className="flex flex-wrap gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <input type="text" placeholder="Search order ID, invoice, customer, phone…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                className={inputCls + " pl-8 w-full"} />
            </div>

            {/* Order Status */}
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
                className={inputCls + " pl-8 w-36 appearance-none pr-8 cursor-pointer"}>
                <option>All</option>
                {ORDER_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            {/* Payment Status */}
            <div className="relative">
              <select value={payF} onChange={(e) => setPayF(e.target.value)}
                className={inputCls + " w-36 appearance-none pr-8 cursor-pointer"}>
                <option>All</option>
                {PAYMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            {/* Payment Method */}
            <div className="relative">
              <select value={methodF} onChange={(e) => setMethodF(e.target.value)}
                className={inputCls + " w-28 appearance-none pr-8 cursor-pointer"}>
                {["All","cash","upi","card"].map((m) => <option key={m} value={m} className="capitalize">{m === "All" ? "All" : m.toUpperCase()}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-text-secondary shrink-0" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className={inputCls + " w-48"} />
              <span className="text-xs text-text-secondary whitespace-nowrap">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className={inputCls + " w-48"} />
            </div>

            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-coral bg-coral-light text-xs font-semibold text-primary hover:bg-red-100 transition-colors">
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {/* Status pills quick-filter */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
            {["All", ...ORDER_STATUSES.map((s) => s.key)].map((s) => {
              const cfg = ORDER_STATUSES.find((o) => o.key === s);
              const count = s === "All" ? orders.length : orders.filter((o) => o.status === s).length;
              return (
                <button key={s}
                  onClick={() => setStatusF(s)}
                  className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold border transition-all ${
                    statusF === s
                      ? cfg ? `${cfg.bg} ${cfg.color} border-current/20` : "bg-primary text-white border-primary"
                      : "border-border text-text-secondary hover:border-slate-300"
                  }`}>
                  {cfg && <cfg.icon size={11} />}
                  {s === "All" ? "All" : cfg!.label} ({count})
                </button>
              );
            })}
            <span className="ml-auto text-xs text-text-secondary self-center">{filtered.length} orders</span>
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div className="glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {[
                    { label:"Order / Invoice", k:null            },
                    { label:"Customer",        k:null            },
                    { label:"Items",           k:null            },
                    { label:"Amount",          k:"grandTotal"    },
                    { label:"Payment",         k:null            },
                    { label:"Status",          k:null            },
                    { label:"Date",            k:"createdAt"     },
                    { label:"Actions",         k:null            },
                  ].map(({ label, k }) => (
                    <th key={label}
                      onClick={() => k && toggleSort(k as typeof sortKey)}
                      className={`px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap ${k ? "cursor-pointer hover:text-text-primary select-none" : ""}`}>
                      {label}
                      {k && <ArrowUpDown size={11} className={`inline ml-1 ${sortKey === k ? "text-coral" : "text-slate-300"}`} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(isEnterprise ? paginatedOrders : filtered).map((order) => {
                  const orderSt = getOrderStatus(order.status);
                  const paySt   = getPayStatus(order.paymentStatus);
                  const densityClass = isEnterprise ? "py-2" : "py-4";
                  return (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-background transition-colors">

                      {/* Order ID */}
                      <td className={`px-5 ${densityClass}`}>
                        <p className="font-semibold text-text-primary text-xs font-mono">{order.invoiceNo}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{order.id}</p>
                        {order.billedBy && (
                          <p className="text-[10px] text-text-secondary mt-1">
                            By: <span className="font-semibold text-text-primary">{order.billedBy}</span>
                          </p>
                        )}
                      </td>

                      {/* Customer */}
                      <td className={`px-5 ${densityClass}`}>
                        <p className="font-semibold text-text-primary whitespace-nowrap">{order.customer || "Walk-in"}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{order.phone}</p>
                      </td>

                      {/* Items */}
                      <td className={`px-5 ${densityClass}`}>
                        <div className="flex items-center gap-1.5">
                          <Package size={13} className="text-text-secondary shrink-0" />
                          <span className="text-text-primary text-xs font-semibold">{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 truncate max-w-[140px]">
                          {order.items.map((i) => i.name).join(", ")}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className={`px-5 ${densityClass}`}>
                        <p className="font-bold text-text-primary tabular-nums">{fmt(order.grandTotal)}</p>
                        {order.totalDiscount > 0 && (
                          <p className="text-xs text-success mt-0.5">−{fmt(order.totalDiscount)} off</p>
                        )}
                      </td>

                      {/* Payment */}
                      <td className={`px-5 ${densityClass}`}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${paySt.bg} ${paySt.color}`}>
                          {paySt.label}
                        </span>
                        <p className="text-xs text-text-secondary mt-1 uppercase">{order.paymentMethod}</p>
                      </td>

                      {/* Order Status */}
                      <td className={`px-5 ${densityClass}`}>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${orderSt.bg} ${orderSt.color}`}>
                          <orderSt.icon size={11} />
                          {orderSt.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className={`px-5 ${densityClass} text-xs text-text-secondary whitespace-nowrap`}>
                        {order.createdAt}
                      </td>

                      {/* Actions */}
                      <td className={`px-5 ${densityClass}`}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewing(order)}
                            className="w-8 h-8 rounded-lg bg-coral-light hover:bg-red-100 text-red-700 flex items-center justify-center transition-colors"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(order.id)}
                            className="w-8 h-8 rounded-lg bg-coral-light hover:bg-red-100 text-coral flex items-center justify-center transition-colors"
                            title="Delete order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer totals */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-background border-t-2 border-border">
                    <td colSpan={3} className="px-5 py-3 text-xs font-bold text-text-primary">
                      {filtered.length} orders total
                    </td>
                    <td className="px-5 py-3 font-bold text-red-700 tabular-nums">
                      {fmt(filtered.reduce((t, o) => t + o.grandTotal, 0))}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Pagination Controls (Enterprise) */}
            {isEnterprise && filtered.length > pageSize && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background">
                <span className="text-xs text-text-secondary">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-primary-light hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-text-primary px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-primary-light hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ShoppingCart size={36} className="text-slate-200" />
                <p className="text-sm font-semibold text-text-secondary">No orders found</p>
                <p className="text-xs text-text-secondary">Try adjusting your filters</p>
                {hasFilters && (
                  <button onClick={clearFilters}
                    className="mt-1 text-xs text-primary font-semibold hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}