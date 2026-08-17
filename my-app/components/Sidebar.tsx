"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeftRight,
  Plus,
  Check,
  Upload,
  Pencil,
  Wallet,
  Store,
  Mail,
  Phone,
  Salad,
  ShoppingBag,
  AlertCircle,
  UserPlus,
  X,
  Percent,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  color?: string;
  bg?: string;
  category?: string;
};

type StoreCategory = "GROCERY" | "GARMENTS";

type StoreAdmin = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
};

type Shop = {
  id: string;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  upiId: string;
  upiPayeeName: string;
  logoUrl: string | null;
  category: StoreCategory;
  admins: StoreAdmin[];
};

type StoredUser = {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  store_id?: number;
};

type BackendAdmin = {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
};

type BackendStore = {
  id: number | string;
  name: string;
  owner_name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  upi_id?: string | null;
  upi_payee_name?: string | null;
  logo_url?: string | null;
  category?: StoreCategory | null;
  users?: BackendAdmin[];
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", category: "Dashboard", icon: LayoutDashboard, color: "text-[#A05AFF]", bg: "bg-[#A05AFF]/10" },
  { label: "Products", href: "/products", category: "Business", icon: Package, badge: 3, color: "text-[#1BCFB4]", bg: "bg-[#1BCFB4]/10" },
  { label: "Billing", href: "/billing", category: "Business", icon: Receipt, color: "text-[#FE9496]", bg: "bg-[#FE9496]/10" },
  { label: "Orders", href: "/orders", category: "Business", icon: ShoppingCart, badge: 12, color: "text-[#4BCBEB]", bg: "bg-[#4BCBEB]/10" },
  { label: "Customers", href: "/customers", category: "Business", icon: Users, color: "text-[#A05AFF]", bg: "bg-[#A05AFF]/10" },
  { label: "Discount", href: "/discount", category: "Business", icon: Percent, color: "text-[#FFD166]", bg: "bg-[#FFD166]/10" },
  { label: "Reports", href: "/reports", category: "Analytics", icon: BarChart3, color: "text-[#FE9496]", bg: "bg-[#FE9496]/10" },
  { label: "Staff", href: "/staff", category: "Management", icon: UserCheck, color: "text-[#1BCFB4]", bg: "bg-[#1BCFB4]/10" },
  { label: "Attendance", href: "/attendance", category: "Management", icon: Calendar, color: "text-[#4BCBEB]", bg: "bg-[#4BCBEB]/10" },
  { label: "Settings", href: "/settings", category: "System", icon: Settings, color: "text-[#A05AFF]", bg: "bg-[#A05AFF]/10" },
];

const CATEGORY_META: Record<StoreCategory, { label: string; icon: LucideIcon; color: string }> = {
  GROCERY: { label: "Grocery", icon: Salad, color: "text-green-600 bg-green-50 border-green-200" },
  GARMENTS: { label: "Garments", icon: ShoppingBag, color: "text-purple-600 bg-purple-50 border-purple-200" },
};

const inputCls = (err?: string) =>
  `w-full px-3 py-2 text-sm text-foreground border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${err ? "border-primary bg-primary-light" : "border-white/10"
  }`;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-primary mt-0.5">{error}</p>}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 mb-4 bg-primary-light border border-primary rounded-xl px-4 py-3">
      <AlertCircle size={15} className="text-primary mt-0.5 shrink-0" />
      <p className="text-xs text-primary">{msg}</p>
    </div>
  );
}

function LogoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-16 h-16 rounded-xl border-2 border-dashed border-white/10 bg-surface flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-light transition-colors overflow-hidden shrink-0"
      >
        {value ? (
          <img src={value} alt="logo" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload size={16} className="text-muted/70" />
            <span className="text-[9px] text-muted/70 font-medium">Logo</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted mb-1">Store Logo</p>
        <p className="text-[11px] text-muted/70 mb-2">PNG, JPG up to 2MB</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[11px] font-semibold text-primary bg-primary-light hover:bg-primary-hover px-2.5 py-1 rounded-lg transition-colors"
          >
            {value ? "Change" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[11px] font-semibold text-primary bg-primary-light hover:bg-primary-hover px-2.5 py-1 rounded-lg transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function CategorySelector({
  value,
  onChange,
  disabled,
}: {
  value: StoreCategory;
  onChange: (v: StoreCategory) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(CATEGORY_META) as StoreCategory[]).map((cat) => {
        const { label, icon: Icon, color } = CATEGORY_META[cat];
        const active = value === cat;
        return (
          <button
            key={cat}
            type="button"
            disabled={disabled}
            onClick={() => onChange(cat)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${active ? `${color} border-current shadow-sm` : "border-white/10 text-muted hover:border-white/20 hover:bg-surface"
              } disabled:opacity-50`}
          >
            <Icon size={15} /> {label}
          </button>
        );
      })}
    </div>
  );
}

function AddAdminModal({
  shopId,
  shopName,
  onClose,
  onAdded,
}: {
  shopId: string;
  shopName: string;
  onClose: () => void;
  onAdded: (admin: StoreAdmin) => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.password.trim()) e.password = "Required";
    if (form.password && form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setApiError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: "ADMIN",
        store_id: Number(shopId),
      });

      const created = response.data;
      onAdded({
        id: String(created.id),
        name: created.name,
        email: created.email,
        phone: created.phone || form.phone.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "Failed to add admin"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <UserPlus size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Add Admin</h2>
              <p className="text-[11px] text-muted/70 truncate max-w-[160px]">{shopName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted/70 hover:text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {apiError && <ErrorBanner msg={apiError} />}

          <Field label="Full Name" required error={errors.name}>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors({ ...errors, name: "" });
              }}
              className={inputCls(errors.name)}
            />
          </Field>

          <Field label="Email" required error={errors.email}>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
              <input
                type="email"
                placeholder="admin@store.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setErrors({ ...errors, email: "" });
                }}
                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? "border-primary bg-primary-light" : "border-white/10"
                  }`}
              />
            </div>
          </Field>

          <Field label="Phone Number">
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
              <input
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                className="w-full pl-8 pr-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </Field>

          <Field label="Password" required error={errors.password}>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setErrors({ ...errors, password: "" });
              }}
              className={inputCls(errors.password)}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-muted border border-white/10 rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-95 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus size={14} /> {isSubmitting ? "Adding..." : "Add Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStoreModal({
  shop,
  onClose,
  onUpdate,
  onAdminAdded,
}: {
  shop: Shop;
  onClose: () => void;
  onUpdate: (updated: Shop) => void;
  onAdminAdded: (shopId: string, admin: StoreAdmin) => void;
}) {
  const [form, setForm] = useState({
    name: shop.name,
    ownerName: shop.ownerName,
    address: shop.address,
    phone: shop.phone,
    upiId: shop.upiId,
    upiPayeeName: shop.upiPayeeName,
    category: shop.category,
    logoUrl: shop.logoUrl,
  });
  const [admins, setAdmins] = useState<StoreAdmin[]>(shop.admins);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [activeTab, setActiveTab] = useState<"details" | "admins">("details");
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onUpdate({
      ...shop,
      name: form.name.trim(),
      ownerName: form.ownerName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      upiId: form.upiId.trim(),
      upiPayeeName: form.upiPayeeName.trim(),
      category: form.category,
      logoUrl: form.logoUrl,
      admins,
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-background rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 w-full max-w-lg mx-auto flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Pencil size={15} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Edit Store</h2>
                <p className="text-[11px] text-muted/70 truncate max-w-[200px]">{shop.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted/70 hover:text-muted transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex px-6 pt-3 gap-1 shrink-0 border-b border-white/5">
            {(["details", "admins"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${activeTab === tab ? "text-primary border-primary bg-primary-light" : "text-muted border-transparent hover:text-foreground/90"
                  }`}
              >
                {tab === "admins" ? `Admins (${admins.length})` : "Store Details"}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4">
            {activeTab === "details" && (
              <form id="edit-store-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/70 mb-2">Store Logo</p>
                  <LogoUploader value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} />
                </div>

                <div className="border-t border-white/5 pt-3 space-y-3">
                  <Field label="Store Name" required error={errors.name}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        setErrors({ ...errors, name: "" });
                      }}
                      className={inputCls(errors.name)}
                    />
                  </Field>

                  <Field label="Owner Name">
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      className={inputCls()}
                    />
                  </Field>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Email <span className="text-muted/70 font-normal">(not editable)</span>
                    </label>
                    <input
                      type="email"
                      value={shop.email}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-white/5 rounded-lg bg-surface text-muted/70 cursor-not-allowed"
                    />
                  </div>

                  <Field label="Address">
                    <input
                      type="text"
                      placeholder="123 Main St, Delhi"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className={inputCls()}
                    />
                  </Field>

                  <Field label="Phone Number">
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
                      <input
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </Field>

                  <Field label="UPI ID">
                    <div className="relative">
                      <Wallet size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
                      <input
                        type="text"
                        placeholder="yourname@upi"
                        value={form.upiId}
                        onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </Field>

                  <Field label="UPI Payee Name">
                    <input
                      type="text"
                      placeholder="Name shown in UPI apps"
                      value={form.upiPayeeName}
                      onChange={(e) => setForm({ ...form, upiPayeeName: e.target.value })}
                      className={inputCls()}
                    />
                  </Field>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">Category</label>
                    <CategorySelector value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
                  </div>
                </div>
              </form>
            )}

            {activeTab === "admins" && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddAdmin(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:opacity-95 transition-colors"
                >
                  <UserPlus size={15} /> Add Admin
                </button>

                {admins.length === 0 ? (
                  <div className="text-center py-8 text-muted/70">
                    <UserCheck size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No admins yet.</p>
                    <p className="text-[11px]">Add an admin to manage this store.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-surface">
                        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{admin.name}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted truncate">
                            <Mail size={9} /> {admin.email}
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-1 text-[10px] text-muted/70">
                              <Phone size={9} /> +91 {admin.phone}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-primary bg-primary-light border border-primary px-2 py-0.5 rounded-full">
                          ADMIN
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-white/5 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-muted border border-white/10 rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            {activeTab === "details" && (
              <button
                type="submit"
                form="edit-store-form"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-95 transition-colors"
              >
                <Check size={14} /> Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {showAddAdmin && (
        <AddAdminModal
          shopId={shop.id}
          shopName={shop.name}
          onClose={() => setShowAddAdmin(false)}
          onAdded={(admin) => {
            setAdmins((prev) => [...prev, admin]);
            onAdminAdded(shop.id, admin);
          }}
        />
      )}
    </>
  );
}

function CreateStoreModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (shop: Shop) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    address: "",
    phone: "",
    email: "",
    upiId: "",
    upiPayeeName: "",
    category: "GROCERY" as StoreCategory,
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [mapPreview, setMapPreview] = useState<{ lat: number; lng: number } | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.address.trim()) e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function parseLatLng(value: string) {
    const parts = value.split(",").map((p) => p.trim());
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  }

  async function resolveAddressToCoords(address: string) {
    const direct = parseLatLng(address);
    if (direct) return direct;

    setLocationStatus("Resolving address...");
    setIsResolvingLocation(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        setLocationStatus("Location not found.");
        return null;
      }

      const first = results[0];
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setLocationStatus("Location could not be resolved.");
        return null;
      }

      return { lat, lng };
    } catch {
      setLocationStatus("Unable to resolve location.");
      return null;
    } finally {
      setIsResolvingLocation(false);
    }
  }

  function buildEmbedUrl(lat: number, lng: number) {
    const delta = 0.01;
    const minLng = lng - delta;
    const minLat = lat - delta;
    const maxLng = lng + delta;
    const maxLat = lat + delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${lat},${lng}`;
  }

  async function openLocationInMap() {
    if (!form.address.trim()) return;
    const coords = await resolveAddressToCoords(form.address.trim());
    if (!coords) return;

    setMapPreview(coords);
    setLocationStatus("Location preview updated.");
    const url = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`;
    window.open(url, "_blank");
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("Fetching current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setForm((prev) => ({ ...prev, address: `${lat}, ${lng}` }));
        setMapPreview({ lat, lng });
        setErrors((prev) => ({ ...prev, address: "" }));
        setLocationStatus("Current location set. You can verify it on the map.");
      },
      () => {
        setLocationStatus("Unable to access current location.");
      }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: uid(),
      name: form.name.trim(),
      ownerName: form.ownerName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      upiId: form.upiId.trim(),
      upiPayeeName: form.upiPayeeName.trim(),
      logoUrl,
      category: form.category,
      admins: [],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 w-full max-w-md mx-auto flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <Store size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Create New Store</h2>
              <p className="text-[11px] text-muted/70">Fill in store details to get started</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted/70 hover:text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form id="create-store-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/70 mb-2">Store Logo</p>
              <LogoUploader value={logoUrl} onChange={setLogoUrl} />
            </div>

            <div className="border-t border-white/5 pt-3 space-y-3">
              <Field label="Store Name" required error={errors.name}>
                <input
                  type="text"
                  placeholder="e.g. Downtown Branch"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors({ ...errors, name: "" });
                  }}
                  className={inputCls(errors.name)}
                />
              </Field>

              <Field label="Owner Name">
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className={inputCls()}
                />
              </Field>

              <Field label="Store Email" required error={errors.email}>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
                  <input
                    type="email"
                    placeholder="store@example.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      setErrors({ ...errors, email: "" });
                    }}
                    className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? "border-primary bg-primary-light" : "border-white/10"
                      }`}
                  />
                </div>
              </Field>

              <Field label="Phone Number">
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </Field>

              <Field label="UPI ID">
                <div className="relative">
                  <Wallet size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
                  <input
                    type="text"
                    placeholder="yourname@upi"
                    value={form.upiId}
                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </Field>

              <Field label="UPI Payee Name">
                <input
                  type="text"
                  placeholder="Name shown in UPI apps"
                  value={form.upiPayeeName}
                  onChange={(e) => setForm({ ...form, upiPayeeName: e.target.value })}
                  className={inputCls()}
                />
              </Field>

              <Field label="Location" required error={errors.address}>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g. 123 Main St, Delhi"
                    value={form.address}
                    onChange={(e) => {
                      setForm({ ...form, address: e.target.value });
                      setErrors({ ...errors, address: "" });
                      setLocationStatus(null);
                      setMapPreview(null);
                    }}
                    className={inputCls(errors.address)}
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs font-semibold text-foreground/90 hover:bg-surface-2 transition-colors"
                    >
                      Use my current location
                    </button>
                    <button
                      type="button"
                      onClick={openLocationInMap}
                      disabled={!form.address.trim() || isResolvingLocation}
                      className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs font-semibold text-foreground/90 hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResolvingLocation ? "Resolving..." : "View on map"}
                    </button>
                  </div>

                  {locationStatus && <p className="text-[11px] text-muted">{locationStatus}</p>}

                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {mapPreview ? (
                      <iframe title="Location preview" src={buildEmbedUrl(mapPreview.lat, mapPreview.lng)} className="w-full h-44" />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-surface p-4 text-sm text-muted">
                        Enter a location and click View on map to preview it here.
                      </div>
                    )}
                  </div>
                </div>
              </Field>

              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  Store Category <span className="text-primary">*</span>
                </label>
                <CategorySelector value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-muted border border-white/10 rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-store-form"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-95 transition-colors"
          >
            <Store size={14} /> Create Store
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreSwitcherModal({
  shops,
  activeShopId,
  onSwitch,
  onClose,
}: {
  shops: Shop[];
  activeShopId: string | null;
  onSwitch: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Switch Store</h2>
          </div>
          <button onClick={onClose} className="text-muted/70 hover:text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
          {shops.length === 0 ? (
            <p className="text-sm text-muted/70 text-center py-6">No stores created yet.</p>
          ) : (
            shops.map((shop) => {
              const isActive = shop.id === activeShopId;
              const catMeta = CATEGORY_META[shop.category];
              const CatIcon = catMeta.icon;

              return (
                <button
                  key={shop.id}
                  onClick={() => {
                    onSwitch(shop.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${isActive ? "bg-purple-50 border border-purple-200 shadow-sm" : "hover:bg-purple-50/40 hover:border-purple-100 border border-transparent text-foreground/90"
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center ${isActive ? "bg-purple-100" : catMeta.color
                      }`}
                  >
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <CatIcon size={18} className={isActive ? "text-purple-600" : ""} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-purple-900" : "text-foreground"}`}>
                      {shop.name}
                    </p>
                    <p className={`text-[11px] truncate ${isActive ? "text-purple-700/80" : "text-muted/70"}`}>
                      {shop.ownerName ? `${shop.ownerName} · ` : ""}
                      {catMeta.label}
                    </p>
                    {shop.phone && (
                      <p className={`text-[10px] ${isActive ? "text-purple-600/70" : "text-muted/70"}`}>
                        +91 {shop.phone}
                      </p>
                    )}
                  </div>

                  {isActive && <Check size={16} className="text-purple-600 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ActiveStoreBanner({
  shop,
  onSwitch,
  onEdit,
  isSuperAdmin,
}: {
  shop: Shop;
  onSwitch: () => void;
  onEdit: () => void;
  isSuperAdmin?: boolean;
}) {
  const catMeta = CATEGORY_META[shop.category];
  const CatIcon = catMeta.icon;

  return (
    <div className="mx-3 mb-4 rounded-2xl border border-primary/30 bg-primary-light/50 backdrop-blur-md p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Active Store</p>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-surface border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <CatIcon size={24} className="text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-sidebar-text truncate">{shop.name}</h3>

          {shop.ownerName && <p className="text-xs text-sidebar-text-secondary truncate mt-0.5">{shop.ownerName}</p>}

          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-2 py-1 rounded-full ${catMeta.color}`}>
              <CatIcon size={10} />
              {catMeta.label}
            </span>
          </div>
        </div>
      </div>

      {(shop.phone || shop.upiId) && (
        <div className="mt-3 space-y-1">
          {shop.phone && (
            <p className="text-xs text-sidebar-text-secondary flex items-center gap-1">
              <span>📞</span>
              <span>+91 {shop.phone}</span>
            </p>
          )}

          {shop.upiId && (
            <p className="text-xs text-sidebar-text-secondary flex items-center gap-1 truncate">
              <span>💳</span>
              <span className="truncate">
                {shop.upiId}
                {shop.upiPayeeName ? ` • ${shop.upiPayeeName}` : ""}
              </span>
            </p>
          )}
        </div>
      )}

      {isSuperAdmin && (
        <div className="mt-3 flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-0.5 text-[9px] font-medium text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-1.5 py-0.5 rounded-md transition-all duration-200"
          >
            <Pencil size={9} />
            Edit
          </button>

          <button
            onClick={onSwitch}
            className="flex items-center justify-center gap-0.5 text-[9px] font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-1.5 py-0.5 rounded-md transition-all duration-200"
          >
            <ArrowLeftRight size={9} />
            Switch
          </button>
        </div>
      )}
    </div>
  );
}

function CompactActiveStore({
  shop,
  onClick,
}: {
  shop: Shop;
  onClick: () => void;
}) {
  const catMeta = CATEGORY_META[shop.category];
  const CatIcon = catMeta.icon;

  return (
    <div className="px-3 pt-3">
      <button
        onClick={onClick}
        title={`${shop.name} · Switch store`}
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary-light/40 hover:bg-primary-light transition-all duration-200 hover:scale-[1.03]"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-surface">
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <CatIcon size={18} className="text-primary" />
          )}
        </div>
      </button>
    </div>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [editShop, setEditShop] = useState<Shop | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setUser(parsed);

        if (parsed.role === "STAFF" && window.location.pathname !== "/attendance") {
          window.location.href = "/attendance";
        }
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage", err);
    }
  }, []);

  const mapStore = (s: BackendStore): Shop => ({
    id: s.id.toString(),
    name: s.name,
    ownerName: s.owner_name || "",
    address: s.address || "",
    phone: s.phone || "",
    email: s.email || "",
    upiId: s.upi_id || "",
    upiPayeeName: s.upi_payee_name || "",
    logoUrl: s.logo_url || null,
    category: s.category || "GROCERY",
    admins:
      s.users?.map((u) => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || "",
      })) || [],
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const profileRes = await api.get("/users/profile");
        const dbLastActiveId = profileRes.data.last_active_store_id?.toString();

        const response = await api.get("/stores");
        const mappedStores = (response.data as BackendStore[]).map(mapStore);
        setShops(mappedStores);

        const savedId = localStorage.getItem("activeStoreId") || dbLastActiveId;

        if (savedId && mappedStores.some((s: Shop) => s.id === savedId)) {
          setActiveShopId(savedId);
          localStorage.setItem("activeStoreId", savedId);
        } else if (mappedStores.length > 0) {
          const firstId = mappedStores[0].id;
          setActiveShopId(firstId);
          localStorage.setItem("activeStoreId", firstId);
          await api.patch("/users/active-store", { storeId: Number(firstId) });
        }
      } catch (err) {
        console.error("Failed to fetch stores or profile:", err);
      }
    };

    fetchInitialData();
  }, []);

  const activeShop = shops.find((s) => s.id === activeShopId) ?? null;

  function handleLogout() {
    setShowLogoutConfirm(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeStoreId");
    router.push("/");
  }

  async function switchStore(id: string) {
    try {
      setActiveShopId(id);
      localStorage.setItem("activeStoreId", id);
      await api.patch("/users/active-store", { storeId: Number(id) });
      window.location.reload();
    } catch (err) {
      console.error("Failed to sync active store to DB:", err);
      window.location.reload();
    }
  }

  async function handleCreateStore(shopData: Shop) {
    try {
      const response = await api.post("/stores", {
        name: shopData.name,
        owner_name: shopData.ownerName,
        email: shopData.email,
        phone: shopData.phone,
        address: shopData.address,
        category: shopData.category,
        logo_url: shopData.logoUrl,
        upi_id: shopData.upiId,
        upi_payee_name: shopData.upiPayeeName,
        admins: shopData.admins,
      });

      const newStore = mapStore(response.data);
      setShops((prev) => [...prev, newStore]);
      if (shops.length === 0) {
        switchStore(newStore.id);
      }
      setShowCreateStore(false);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to create store"));
    }
  }

  async function handleUpdateStore(updated: Shop) {
    try {
      const response = await api.put(`/stores/${updated.id}`, {
        name: updated.name,
        owner_name: updated.ownerName,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        category: updated.category,
        logo_url: updated.logoUrl,
        upi_id: updated.upiId,
        upi_payee_name: updated.upiPayeeName,
        admins: updated.admins,
      });

      const updatedStore = mapStore(response.data);
      setShops((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)));
      setEditShop(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to update store"));
    }
  }

  const isSuperAdmin = !user || user.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";

  const visibleNavItems = navItems.filter((item) => {
    if (isStaff) {
      return ["Attendance"].includes(item.label);
    }
    if (isAdmin) {
      if (["Dashboard", "Reports", "Settings", "Attendance"].includes(item.label)) return false;
      return true;
    }
    if (item.label === "Attendance") return false;
    return true;
  });

  return (
    <>
      <aside
        className={`flex h-full ${collapsed ? "w-24" : "w-64"
          } flex-col border-r border-sidebar-border bg-sidebar-bg backdrop-blur-xl overflow-y-auto transition-[width] duration-300`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
          <div className={`flex items-center min-w-0 ${collapsed ? "gap-0" : "gap-3"}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 overflow-hidden shadow-sm border border-white/10">
              <img src="/logo.png" alt="Stock Management Logo" className="w-full h-full object-cover scale-[1.1]" />
            </div>

            {!collapsed && (
              <div className="whitespace-nowrap overflow-hidden">
                <p className="text-sm font-bold text-sidebar-text leading-tight transition-colors">Stock</p>
                <p className="text-xs text-primary font-semibold leading-tight transition-colors">Management</p>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-sidebar-text-secondary hover:bg-primary-light hover:text-primary transition-colors shrink-0"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}
        </div>

        {/* ── Active Store Banner (commented out) ── */}
        {/* {activeShop && !isStaff && !collapsed && (
          <div className="pt-3">
            <ActiveStoreBanner
              shop={activeShop}
              onSwitch={() => setShowSwitcher(true)}
              onEdit={() => setEditShop(activeShop)}
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        )}

        {activeShop && !isStaff && collapsed && (
          <CompactActiveStore shop={activeShop} onClick={() => setShowSwitcher(true)} />
        )} */}

        {isSuperAdmin && !collapsed && (
          <div className="px-3 pb-4">
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text-secondary/70">
                  Stores ({shops.length})
                </p>

                <div className="flex items-center gap-1.5">
                  {shops.length > 1 && (
                    <button
                      onClick={() => setShowSwitcher(true)}
                      title="Switch store"
                      className="flex h-5 w-5 items-center justify-center rounded bg-surface hover:bg-primary-light text-sidebar-text-secondary hover:text-primary transition-colors border border-white/10"
                    >
                      <ArrowLeftRight size={10} />
                    </button>
                  )}

                  <button
                    onClick={() => setShowCreateStore(true)}
                    title="Create store"
                    className="flex h-5 w-5 items-center justify-center rounded bg-primary-light text-primary hover:opacity-90 transition-colors border border-primary/10"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {shops.length === 0 ? (
                <p className="text-[11px] text-muted/70 px-2 py-1">
                  No stores yet.{" "}
                  <button onClick={() => setShowCreateStore(true)} className="text-primary hover:underline font-semibold">
                    Create one
                  </button>
                </p>
              ) : (
                <div className="space-y-1">
                  {shops.map((shop) => {
                    const isActive = shop.id === activeShopId;
                    const catMeta = CATEGORY_META[shop.category];
                    const CatIcon = catMeta.icon;

                    return (
                      <div
                        key={shop.id}
                        onClick={() => switchStore(shop.id)}
                        className={`w-full rounded-xl p-3 text-left transition-all duration-200 border cursor-pointer
                          ${isActive
                            ? "bg-purple-50/80 border-purple-200 shadow-sm"
                            : "bg-transparent hover:bg-purple-50/40 hover:border-purple-100 hover:shadow-sm hover:scale-[1.01] border-transparent"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg shrink-0 overflow-hidden flex items-center justify-center
                              ${isActive ? "bg-purple-100" : "bg-white/10"}
                            `}
                          >
                            {shop.logoUrl ? (
                              <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                            ) : (
                              <CatIcon size={14} className={isActive ? "text-purple-600" : "text-primary"} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${isActive ? "text-purple-900" : "text-sidebar-text"}`}>{shop.name}</p>
                                <p className={`text-[10px] truncate ${isActive ? "text-purple-700/80" : "text-sidebar-text-secondary"}`}>
                                  {shop.ownerName || catMeta.label}
                                  {shop.phone ? ` • ${shop.phone}` : ""}
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditShop(shop);
                                  }}
                                  className="p-1 rounded-md text-sidebar-text-secondary hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                                  title="Edit Store"
                                >
                                  <Pencil size={11} />
                                </button>

                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete "${shop.name}"?`)) {
                                      try {
                                        await api.delete(`/stores/${shop.id}`);
                                        window.location.reload();
                                      } catch (err) {
                                        alert("Failed to delete store: " + getErrorMessage(err, "Unknown error"));
                                      }
                                    }
                                  }}
                                  className="p-1 rounded-md text-sidebar-text-secondary hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                  title="Delete Store"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {isActive && <div className="mt-1 text-[10px] text-purple-600 font-medium">Active Store</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {isSuperAdmin && collapsed && (
          <div className="px-3 pt-3">
            <div className="border-t border-white/5 pt-3 flex flex-col items-center gap-2">
              {shops.length > 1 && (
                <button
                  onClick={() => setShowSwitcher(true)}
                  title="Switch store"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface hover:bg-primary-light text-sidebar-text-secondary hover:text-primary transition-colors border border-white/10"
                >
                  <ArrowLeftRight size={13} />
                </button>
              )}

              <button
                onClick={() => setShowCreateStore(true)}
                title="Create store"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary hover:opacity-90 transition-colors border border-primary/10"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        )}

        <nav className="py-4 space-y-2 shrink-0 flex-1">
          {!collapsed && theme !== "enterprise" && (
            <p className="px-6 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text-secondary transition-colors">
              Main Menu
            </p>
          )}

          {visibleNavItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const isEnterprise = theme === "enterprise";
            const showCategory = isEnterprise && !collapsed && (index === 0 || visibleNavItems[index - 1].category !== item.category);

            const enterpriseActiveClasses = isEnterprise && isActive
              ? "bg-sidebar-active text-primary font-semibold border-l-4 border-primary"
              : isEnterprise ? "text-sidebar-text-secondary hover:text-white hover:bg-white/5 border-l-4 border-transparent" : "";
            const saasActiveClasses = !isEnterprise && isActive ? "bg-sidebar-active text-sidebar-text shadow-sm" : !isEnterprise ? "text-sidebar-text-secondary hover:bg-white/5" : "";

            return (
              <div key={item.href}>
                {showCategory && (
                  <p className="px-6 pt-5 pb-3 text-xs font-semibold text-primary uppercase tracking-wider">{item.category}</p>
                )}

                <Link
                  href={item.href}
                  title={collapsed ? item.label : ""}
                  className={`group flex items-center text-sm font-medium transition-all ${collapsed
                    ? "mx-3 h-12 justify-center rounded-2xl"
                    : isEnterprise
                      ? "gap-4 px-6 py-2.5"
                      : "mx-3 gap-3 px-3 py-2 rounded-xl"
                    } ${enterpriseActiveClasses} ${saasActiveClasses}`}
                >
                  <div
                    className={`relative shrink-0 flex items-center justify-center transition-colors ${collapsed ? "w-10 h-10 rounded-xl" : "w-8 h-8"
                      } ${isEnterprise
                        ? isActive
                          ? "text-primary"
                          : "text-sidebar-text-secondary group-hover:text-primary"
                        : isActive
                          ? `${item.bg} ${item.color} rounded-xl ring-1 ring-black/5`
                          : `${item.bg} ${item.color} rounded-xl opacity-80 group-hover:opacity-100`
                      }`}
                  >
                    <Icon size={isEnterprise ? 20 : 18} />
                  </div>

                  {!collapsed && <span className={`flex-1 ${isEnterprise && isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>}

                  {!collapsed && item.badge != null && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${isActive
                        ? isEnterprise
                          ? "bg-primary text-sidebar-bg"
                          : "bg-primary text-white"
                        : "bg-sidebar-border text-sidebar-text"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4 shrink-0 mt-auto">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} mb-3`}>
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold shrink-0 transition-colors shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "SA"}
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-text truncate transition-colors">{user?.name || "Super Admin"}</p>
                <p className="text-xs text-sidebar-text-secondary truncate transition-colors">
                  {user?.email || "admin@stockmgmt.com"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={collapsed ? "Sign out" : ""}
            className={`flex w-full items-center rounded-xl text-sm font-medium text-sidebar-text-secondary hover:bg-primary-light hover:text-primary transition-colors ${collapsed ? "justify-center p-3" : "gap-2 px-3 py-2"
              }`}
          >
            <LogOut size={collapsed ? 18 : 16} />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {showCreateStore && <CreateStoreModal onClose={() => setShowCreateStore(false)} onSave={handleCreateStore} />}

      {showSwitcher && (
        <StoreSwitcherModal
          shops={shops}
          activeShopId={activeShopId}
          onSwitch={switchStore}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      {editShop && (
        <EditStoreModal
          shop={editShop}
          onClose={() => setEditShop(null)}
          onUpdate={handleUpdateStore}
          onAdminAdded={(shopId, admin) => {
            setShops((prev) =>
              prev.map((shop) => (shop.id === shopId ? { ...shop, admins: [...shop.admins, admin] } : shop))
            );
          }}
        />
      )}

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 w-full max-w-sm mx-auto p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-coral-light mx-auto mb-4">
              <LogOut className="w-5 h-5 text-coral" />
            </div>
            <h2 className="text-base font-bold text-foreground text-center">Sign Out?</h2>
            <p className="text-sm text-muted text-center mt-1 mb-6">
              Do you really want to sign out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-10 rounded-lg border border-white/10 text-sm font-medium text-muted hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-10 rounded-lg bg-primary text-sm font-semibold text-white hover:opacity-95 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}