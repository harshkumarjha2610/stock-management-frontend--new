"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, Eye, Pencil, Trash2, X, ChevronDown,
  User, Phone, Mail, MapPin, ShoppingCart, IndianRupee,
  TrendingUp, Users, Star, Package, Loader2, Download, ChevronLeft, ChevronRight, CalendarDays, CheckCircle, ArrowUpDown, Filter
} from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type Customer = {
  id:           string;
  name:         string;
  phone:        string;
  email:        string;
  address:      string;
  city:         string;
  totalOrders:  number;
  totalSpent:   number;
  lastPurchase: string;
  joinedDate:   string;
  status:       "active" | "inactive";
  tag:          "regular" | "vip" | "new";
};

type ModalMode = "add" | "edit" | "view" | null;

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

// Customers will be fetched from API

const CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Kochi", "Ahmedabad", "Pune", "Jaipur"];

const TAG_CONFIG = {
  vip:     { label:"VIP",     cls:"bg-warning/10 text-warning",  dot:"bg-warning/100"  },
  regular: { label:"Regular", cls:"bg-coral-light text-red-700",    dot:"bg-primary"   },
  new:     { label:"New",     cls:"bg-mint-light text-success",  dot:"bg-mint-light0"  },
};

const EMPTY_FORM: Omit<Customer, "id" | "totalOrders" | "totalSpent" | "lastPurchase" | "joinedDate"> = {
  name: "", phone: "", email: "", address: "", city: "Delhi",
  status: "active", tag: "regular",
};

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-colors";

const labelCls = "text-xs font-semibold text-text-secondary uppercase tracking-wide";

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function genId(list: Customer[]) {
  const max = list.length
    ? Math.max(...list.map((c) => parseInt(c.id.split("-")[1] || "0")))
    : 0;
  return `CUS-${String(max + 1).padStart(3, "0")}`;
}

// ═══════════════════════════════════════════════════════════
// CUSTOMER MODAL — Add / Edit / View
// ═══════════════════════════════════════════════════════════

function CustomerModal({
  mode, customer, allCustomers, onSave, onClose,
}: {
  mode:         ModalMode;
  customer:     Customer | null;
  allCustomers: Customer[];
  onSave:       (c: Customer) => void;
  onClose:      () => void;
}) {
  const isView = mode === "view";
  const [form, setForm] = useState<typeof EMPTY_FORM>(() => {
    if (customer) {
      const { id, totalOrders, totalSpent, lastPurchase, joinedDate, ...rest } = customer;
      return rest;
    }
    return { ...EMPTY_FORM };
  });
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) return;
    const today = "2026-04-22";
    const saved: Customer = customer && mode === "edit"
      ? { ...customer, ...form }
      : { ...form, id: genId(allCustomers), totalOrders: 0, totalSpent: 0, lastPurchase: "—", joinedDate: today };
    onSave(saved);
    setSaved(true);
    setTimeout(onClose, 400);
  }

  if (isView && customer) {
    const tag = TAG_CONFIG[customer.tag];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <span className="text-base font-bold text-red-700">
                  {customer.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">{customer.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-text-secondary">{customer.id}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tag.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
                    {tag.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${customer.status === "active" ? "bg-mint-light text-success" : "bg-background text-text-secondary"}`}>
                    {customer.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-background text-text-secondary flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:"Total Orders",  value: customer.totalOrders,      icon:ShoppingCart, color:"text-primary",   bg:"bg-coral-light"  },
                { label:"Total Spent",   value: fmt(customer.totalSpent),   icon:IndianRupee,  color:"text-success",  bg:"bg-mint-light" },
                { label:"Avg/Order",     value: customer.totalOrders > 0 ? fmt(Math.round(customer.totalSpent / customer.totalOrders)) : "—", icon:TrendingUp, color:"text-purple-700", bg:"bg-purple-50" },
              ].map((s) => (
                <div key={s.label} className="bg-background rounded-xl border border-border px-3 py-3 text-center">
                  <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${s.bg} mb-2`}>
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <p className={labelCls}>Contact Information</p>
              {[
                { icon:Phone,    label:"Phone",        value: customer.phone              },
                { icon:Mail,     label:"Email",        value: customer.email || "—"       },
                { icon:MapPin,   label:"Address",      value: `${customer.address}, ${customer.city}` },
                { icon:CalendarDays, label:"Joined",   value: customer.joinedDate         },
                { icon:ShoppingCart, label:"Last Purchase", value: customer.lastPurchase  },
              ].map((r) => (
                <div key={r.label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
                    <r.icon size={13} className="text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">{r.label}</p>
                    <p className="text-sm font-semibold text-text-primary">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border shrink-0">
            <button onClick={onClose} className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Add / Edit Form ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[94vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {mode === "add" ? "Add New Customer" : `Edit — ${customer?.id}`}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {mode === "add" ? "Fill in customer details" : "Update customer information"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-background text-text-secondary flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className={labelCls}>Full Name *</label>
              <input type="text" placeholder="e.g. Arjun Das"
                value={form.name} onChange={(e) => set("name", e.target.value)}
                className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                <input type="tel" placeholder="9876543210"
                  value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className={inputCls + " pl-8"} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                <input type="email" placeholder="email@example.com"
                  value={form.email} onChange={(e) => set("email", e.target.value)}
                  className={inputCls + " pl-8"} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className={labelCls}>Address (Optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <input type="text" placeholder="Street / House No."
                value={form.address} onChange={(e) => set("address", e.target.value)}
                className={inputCls + " pl-8"} />
            </div>
          </div>

          {/* City + Tag + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>City</label>
              <div className="relative">
                <select value={form.city} onChange={(e) => set("city", e.target.value)}
                  className={inputCls + " appearance-none pr-8 cursor-pointer"}>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Tag</label>
              <div className="relative">
                <select value={form.tag} onChange={(e) => set("tag", e.target.value as Customer["tag"])}
                  className={inputCls + " appearance-none pr-8 cursor-pointer"}>
                  <option value="new">New</option>
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Status</label>
              <div className="relative">
                <select value={form.status} onChange={(e) => set("status", e.target.value as Customer["status"])}
                  className={inputCls + " appearance-none pr-8 cursor-pointer"}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            disabled={!form.name.trim() || !form.phone.trim() || saved}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              saved
                ? "bg-mint-light0"
                : "bg-primary hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}>
            {saved
              ? <><CheckCircle size={16} /> Saved!</>
              : mode === "add" ? "Add Customer" : "Save Changes"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function CustomersPage() {
  const { theme } = useTheme();
  const isEnterprise = theme === "enterprise";

  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [loading,    setLoading]    = useState(true);
  
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const res = await api.get('/customers');
        setCustomers(res.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || "",
          address: c.address || "",
          city: c.city || "Other",
          totalOrders: c.total_orders || 0,
          totalSpent: parseFloat(c.total_spent || 0),
          lastPurchase: c.last_purchase?.split('T')[0] || "—",
          joinedDate: c.createdAt?.split('T')[0] || "—",
          status: c.status || "active",
          tag: c.tag || "regular"
        })));
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const [search,     setSearch]     = useState("");
  const [tagFilter,  setTagFilter]  = useState("All");
  const [stFilter,   setStFilter]   = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [sortKey,    setSortKey]    = useState<"name" | "totalSpent" | "totalOrders" | "joinedDate">("totalSpent");
  const [sortDir,    setSortDir]    = useState<"asc" | "desc">("desc");
  const [modal,      setModal]      = useState<ModalMode>(null);
  const [selected,   setSelected]   = useState<Customer | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isEnterprise ? 15 : 10;

  // ── Stats ──
  const stats = useMemo(() => ({
    total:    customers.length,
    active:   customers.filter((c) => c.status === "active").length,
    vip:      customers.filter((c) => c.tag === "vip").length,
    revenue:  customers.reduce((t, c) => t + c.totalSpent, 0),
  }), [customers]);

  // ── Filtered ──
  const filtered = useMemo(() => {
    return customers
      .filter((c) => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q);
        const matchTag  = tagFilter  === "All" || c.tag    === tagFilter;
        const matchSt   = stFilter   === "All" || c.status === stFilter;
        const matchCity = cityFilter === "All" || c.city   === cityFilter;
        return matchSearch && matchTag && matchSt && matchCity;
      })
      .sort((a, b) => {
        let cmp = 0;
        if      (sortKey === "name")        cmp = a.name.localeCompare(b.name);
        else if (sortKey === "totalSpent")  cmp = a.totalSpent  - b.totalSpent;
        else if (sortKey === "totalOrders") cmp = a.totalOrders - b.totalOrders;
        else                                cmp = a.joinedDate.localeCompare(b.joinedDate);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [customers, search, tagFilter, stFilter, cityFilter, sortKey, sortDir]);

  useEffect(() => { setCurrentPage(1); }, [search, tagFilter, stFilter, cityFilter]);

  const paginatedCustomers = useMemo(() => {
    if (!isEnterprise) return filtered;
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize, isEnterprise]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function openModal(mode: ModalMode, c?: Customer) {
    setSelected(c ?? null);
    setModal(mode);
  }

  async function handleSave(c: Customer) {
    setLoading(true);
    try {
      const payload = {
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        status: c.status,
        tag: c.tag
      };

      if (selected) {
        await api.put(`/customers/${selected.id}`, payload);
        setCustomers((prev) => prev.map((x) => x.id === selected.id ? c : x));
      } else {
        const res = await api.post('/customers', payload);
        const newCustomer: Customer = {
          ...c,
          id: res.data.id,
          joinedDate: res.data.createdAt?.split('T')[0]
        };
        setCustomers((prev) => [newCustomer, ...prev]);
      }
    } catch (error: any) {
      alert(error.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      await api.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
    } catch (error: any) {
      alert(error.message || "Failed to delete customer");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch(""); setTagFilter("All"); setStFilter("All"); setCityFilter("All");
  }

  const hasFilters = search || tagFilter !== "All" || stFilter !== "All" || cityFilter !== "All";
  const allCities  = ["All", ...Array.from(new Set(customers.map((c) => c.city))).sort()];

  function handleExportCSV() {
    const rows = [
      ["Customer ID", "Name", "Phone", "Email", "City", "Tag", "Total Orders", "Total Spent", "Last Purchase", "Joined Date", "Status"].join(","),
      ...filtered.map(c => [
        c.id, `"${c.name}"`, c.phone, c.email, `"${c.city}"`, c.tag, c.totalOrders, c.totalSpent, c.lastPurchase, c.joinedDate, c.status
      ].join(","))
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Customers_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  const SortIcon = ({ k }: { k: typeof sortKey }) => (
    <ArrowUpDown size={11} className={`inline ml-1 ${sortKey === k ? "text-coral" : "text-slate-300"}`} />
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-secondary">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Modal ── */}
      {modal && (
        <CustomerModal
          mode={modal}
          customer={selected}
          allCustomers={customers}
          onSave={handleSave}
          onClose={() => { setModal(null); setSelected(null); }}
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
              <h3 className="text-base font-bold text-text-primary">Delete Customer?</h3>
              <p className="text-sm text-text-secondary mt-1">
                <span className="font-semibold text-text-primary">{customers.find((c) => c.id === deleteId)?.name}</span> and all their data will be permanently removed.
              </p>
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Customers</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage customer profiles & purchase history</p>
          </div>
          <div className="flex items-center gap-3">
            {isEnterprise && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-background border border-border text-text-primary text-sm font-semibold hover:bg-surface transition-colors"
              >
                <Download size={16} className="text-primary" />
                Export CSV
              </button>
            )}
            <button
              onClick={() => openModal("add")}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary hover:bg-red-700 text-sm font-semibold text-white transition-colors shadow-sm shadow-red-200"
            >
              <Plus size={16} /> Add Customer
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label:"Total Customers", value: stats.total,    sub:"All registered",    icon:Users,      bg:"bg-background", ic:"text-text-primary"  },
            { label:"Active",          value: stats.active,   sub:"Currently active",  icon:CheckCircle, bg:"bg-mint-light", ic:"text-success"  },
            { label:"VIP Customers",   value: stats.vip,      sub:"High-value buyers", icon:Star,        bg:"bg-warning/10", ic:"text-warning"  },
            { label:"Total Revenue",   value:`₹${(stats.revenue/1000).toFixed(1)}K`, sub:"All time", icon:IndianRupee, bg:"bg-coral-light", ic:"text-primary" },
          ].map((k, i) => (
            <div key={k.label} className={`kpi-card kpi-${(i % 4) + 13}`}>
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
              <input type="text" placeholder="Search name, phone, email, city, ID…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                className={inputCls.replace("bg-background","bg-surface") + " pl-8 w-full h-9"} />
            </div>

            {/* Tag */}
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface pl-8 pr-8 text-sm text-text-primary outline-none focus:border-red-400 appearance-none cursor-pointer">
                <option>All</option>
                <option value="new">New</option>
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            {/* Status */}
            <div className="relative">
              <select value={stFilter} onChange={(e) => setStFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-3 pr-8 text-sm text-text-primary outline-none focus:border-red-400 appearance-none cursor-pointer">
                <option>All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            {/* City */}
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface pl-8 pr-8 text-sm text-text-primary outline-none focus:border-red-400 appearance-none cursor-pointer">
                {allCities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-coral bg-coral-light text-xs font-semibold text-primary hover:bg-red-100 transition-colors">
                <X size={13} /> Clear
              </button>
            )}

            <span className="ml-auto text-xs text-text-secondary self-center">{filtered.length} customers</span>
          </div>
        </div>

        {/* ── Customers Table ── */}
        <div className="glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {[
                    { label:"Customer",     k:"name"        },
                    { label:"Contact",      k:null          },
                    { label:"City",         k:null          },
                    { label:"Tag",          k:null          },
                    { label:"Orders",       k:"totalOrders" },
                    { label:"Total Spent",  k:"totalSpent"  },
                    { label:"Last Purchase",k:null          },
                    { label:"Joined",       k:"joinedDate"  },
                    { label:"Status",       k:null          },
                    { label:"Actions",      k:null          },
                  ].map(({ label, k }) => (
                    <th key={label}
                      onClick={() => k && toggleSort(k as typeof sortKey)}
                      className={`px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap ${k ? "cursor-pointer hover:text-text-primary select-none" : ""}`}>
                      {label}
                      {k && <SortIcon k={k as typeof sortKey} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(isEnterprise ? paginatedCustomers : filtered).map((c) => {
                  const tag = TAG_CONFIG[c.tag];
                  const density = isEnterprise ? "py-1.5" : "py-3.5";
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-background transition-colors">

                      {/* Customer */}
                      <td className={`px-4 ${density}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-red-700">{c.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary whitespace-nowrap">{c.name}</p>
                            <p className="text-xs font-mono text-text-secondary">{c.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className={`px-4 ${density}`}>
                        <div className="flex items-center gap-1.5 text-text-primary text-xs">
                          <Phone size={11} className="text-text-secondary" />
                          {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-text-secondary text-xs mt-0.5">
                            <Mail size={11} />
                            <span className="truncate max-w-[140px]">{c.email}</span>
                          </div>
                        )}
                      </td>

                      {/* City */}
                      <td className={`px-4 ${density} text-text-primary text-sm`}>{c.city}</td>

                      {/* Tag */}
                      <td className={`px-4 ${density}`}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tag.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
                          {tag.label}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className={`px-4 ${density}`}>
                        <div className="flex items-center gap-1.5">
                          <Package size={12} className="text-text-secondary" />
                          <span className="font-semibold text-text-primary tabular-nums">{c.totalOrders}</span>
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className={`px-4 ${density} font-bold text-text-primary tabular-nums`}>
                        {fmt(c.totalSpent)}
                      </td>

                      {/* Last Purchase */}
                      <td className={`px-4 ${density} text-xs text-text-secondary whitespace-nowrap`}>
                        {c.lastPurchase}
                      </td>

                      {/* Joined */}
                      <td className={`px-4 ${density} text-xs text-text-secondary whitespace-nowrap`}>
                        {c.joinedDate}
                      </td>

                      {/* Status */}
                      <td className={`px-4 ${density}`}>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === "active"
                            ? "bg-mint-light text-success"
                            : "bg-background text-text-secondary"
                        }`}>
                          {c.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={`px-4 ${density}`}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openModal("view", c)}
                            className="w-8 h-8 rounded-lg bg-coral-light hover:bg-red-100 text-red-700 flex items-center justify-center transition-colors" title="View">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openModal("edit", c)}
                            className="w-8 h-8 rounded-lg bg-background hover:bg-slate-200 text-text-primary flex items-center justify-center transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(c.id)}
                            className="w-8 h-8 rounded-lg bg-coral-light hover:bg-red-100 text-coral flex items-center justify-center transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-background border-t-2 border-border">
                    <td colSpan={5} className="px-4 py-3 text-xs font-bold text-text-primary">
                      {filtered.length} customers total
                    </td>
                    <td className="px-4 py-3 font-bold text-red-700 tabular-nums">
                      {fmt(filtered.reduce((t, c) => t + c.totalSpent, 0))}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>

            {isEnterprise && filtered.length > pageSize && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background">
                <span className="text-xs text-text-secondary">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-primary-light hover:text-primary disabled:opacity-50 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold px-2">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-primary-light hover:text-primary disabled:opacity-50 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Users size={36} className="text-slate-200" />
                <p className="text-sm font-semibold text-text-secondary">No customers found</p>
                <p className="text-xs text-text-secondary">Try adjusting your search or filters</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-1 text-xs text-primary font-semibold hover:underline">
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