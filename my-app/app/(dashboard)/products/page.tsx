"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Plus, Eye, Pencil, Trash2, X, ChevronDown,
  Package, Tag, AlertTriangle, Camera, Upload,
  IndianRupee, Percent, BarChart3, ImageOff, CheckCircle,
  ArrowUpDown, Grid3X3, List, XCircle, Shirt, Loader2, Printer,
  Lightbulb, Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import Barcode from "@/components/Barcode";
import JsBarcode from "jsbarcode";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Product = {
  id: string;
  name: string;
  category: string;

  // Garment specific
  gender?: string;
  fabric?: string;
  color?: string;
  sizes?: SizeStock[];

  // Grocery specific
  unit?: string;
  expiryDate?: string;
  mfgDate?: string;
  hsnCode?: string;
  stockQuantity?: number;

  // Purchase details
  invoiceNumber?: string;
  purchaseDate?: string;

  brand?: string;
  purchasePrice: number;
  sellingPrice: number;
  discountedPrice?: number | null;
  discountPercent?: number | null;
  gstPercent: number;
  minStockAlert: number;
  description?: string;
  sku?: string;
  barcode?: string;
  barcodeImageUrl?: string;
  image?: string;
  createdDate: string;
};

type SizeStock = {
  size: string;
  qty: number;
  barcode?: string;
  barcodeImageUrl?: string;
};

type ModalMode = "add" | "edit" | "view" | null;
type ViewMode = "table" | "grid";
type SortKey = "name" | "totalStock" | "sellingPrice" | "createdDate";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CLOTHING_CATEGORIES = [
  "T-Shirt", "Shirt", "Pant", "Jeans", "Kurta", "Kurti",
  "Saree", "Lehenga", "Dress", "Jacket", "Hoodie",
  "Shorts", "Skirt", "Suit", "Tracksuit", "Innerwear",
  "Winterwear", "Ethnic Wear", "Other",
];

const GENDERS = ["Men", "Women", "Kids", "Child", "Unisex"];

const FABRICS = [
  "Cotton", "Polyester", "Linen", "Silk", "Wool",
  "Rayon", "Denim", "Chiffon", "Georgette", "Velvet",
  "Nylon", "Spandex", "Blended", "Other",
];

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const BOTTOM_SIZES = ["26", "28", "30", "32", "34", "36", "38", "40", "42"];
const KIDS_SIZES = ["0-6M", "6-12M", "1Y", "2Y", "3Y", "4Y", "6Y", "8Y", "10Y", "12Y"];

const GROCERY_CATEGORIES = [
  "Fruits & Vegetables", "Dairy & Bakery", "Staples",
  "Snacks & Branded Foods", "Beverages", "Personal Care",
  "Home Care", "Baby Care", "Meat & Fish", "Others",
];

const UNITS = ["kg", "g", "liter", "ml", "pcs", "packet", "bottle", "box"];

const GST_OPTIONS = [0, 5, 12, 18];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function totalStock(p: Product) {
  if (p.sizes && p.sizes.length > 0) {
    return p.sizes.reduce((s, x) => s + (x.qty || 0), 0);
  }
  return p.stockQuantity || 0;
}

function getStockBadge(p: Product) {
  const total = totalStock(p);
  if (total === 0) return { label: "Out of Stock", cls: "bg-coral-light text-primary border-coral" };
  if (total <= p.minStockAlert) return { label: "Low Stock", cls: "bg-warning/10 text-warning border-warning" };
  return { label: "In Stock", cls: "bg-mint-light text-success border-mint" };
}

function marginPct(p: Product) {
  if (!p.purchasePrice) return 0;
  return Math.round(((p.sellingPrice - p.purchasePrice) / p.purchasePrice) * 100);
}

function sellingWithGST(p: Product) {
  return Math.round(p.sellingPrice * (1 + p.gstPercent / 100));
}

function getSizesForCategory(category: string, gender: string): string[] {
  if (["Jeans", "Pant", "Shorts", "Skirt"].includes(category))
    return BOTTOM_SIZES;
  if (gender === "Kids" || gender === "Child")
    return KIDS_SIZES;
  return APPAREL_SIZES;
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-colors";

const textareaCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-colors resize-none";

const selectCls = inputCls + " appearance-none pr-8 cursor-pointer";

// ═══════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Field({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span === 2 ? "col-span-2" : ""}`}>
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  span,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  span?: number;
}) {
  return (
    <Field label={label} span={span}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectCls}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
      </div>
    </Field>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTION INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════

function SuggestionInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  error,
  span = 1,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  error?: string;
  span?: number;
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim() || query === value) return suggestions;
    const q = query.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [query, value, suggestions]);

  function handleSelect(s: string) {
    onChange(s);
    setQuery(s);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  return (
    <Field label={label} span={span}>
      <div ref={containerRef} className="relative">
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={(e) => {
              setOpen(true);
              e.target.select();
            }}
            className={`${inputCls} ${Icon ? "pl-8" : ""} ${error ? "border-red-400 bg-coral-light" : ""} pr-8`}
          />
          <button
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
          >
            <Sparkles size={14} className={open ? "text-primary" : ""} />
          </button>
        </div>

        {error && <p className="text-[11px] text-coral mt-1">{error}</p>}

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-border shadow-lg shadow-black/5 max-h-52 overflow-y-auto">
            <div className="px-3 py-2 border-b border-border bg-background/50">
              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1">
                <Lightbulb size={10} /> Suggestions
              </p>
            </div>
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-text-secondary text-center">No suggestions found</p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-primary-light transition-colors flex items-center gap-2 ${value === s ? "bg-primary-light text-primary font-semibold" : "text-text-primary"
                    }`}
                >
                  <Sparkles size={12} className="text-text-secondary shrink-0" />
                  {s}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Field>
  );
}


function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  bg,
  ic,
  highlight,
  index = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  bg: string;
  ic: string;
  highlight?: boolean;
  index?: number;
}) {
  return (
    <div className={`kpi-card kpi-${(index % 4) + 5} ${highlight ? "kpi-highlight" : ""}`}>
      <div className="kpi-icon-box">
        <Icon className="w-5 h-5" />
      </div>
      <p className="kpi-value">{value}</p>
      <p className="kpi-label">{label}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  );
}

function ProductImage({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const [error, setError] = useState(false);
  const dim =
    size === "sm" ? "w-10 h-10" : size === "lg" ? "w-24 h-24" : "w-14 h-14";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 28 : 20;
  if (!src || error) {
    return (
      <div
        className={`${dim} rounded-xl bg-background border border-border flex items-center justify-center shrink-0`}
      >
        <Shirt size={iconSize} className="text-slate-300" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={`${dim} rounded-xl object-cover border border-border shrink-0`}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// SIZE STOCK EDITOR
// ═══════════════════════════════════════════════════════════════

function SizeStockEditor({
  sizes,
  category,
  gender,
  onChange,
}: {
  sizes: SizeStock[];
  category: string;
  gender: string;
  onChange: (s: SizeStock[]) => void;
}) {
  const availableSizes = getSizesForCategory(category, gender);

  function toggleSize(size: string) {
    const exists = sizes.find((s) => s.size === size);
    if (exists) {
      onChange(sizes.filter((s) => s.size !== size));
    } else {
      onChange([...sizes, { size, qty: 0 }]);
    }
  }

  function updateQty(size: string, qty: number) {
    onChange(sizes.map((s) => (s.size === size ? { ...s, qty: Math.max(0, qty) } : s)));
  }

  const active = sizes.map((s) => s.size);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {availableSizes.map((size) => {
          const isActive = active.includes(size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`h-8 min-w-[2.5rem] px-2.5 rounded-lg text-xs font-bold border transition-all ${isActive
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-background text-text-secondary border-border hover:border-primary hover:text-primary"
                }`}
            >
              {size}
            </button>
          );
        })}
      </div>

      {sizes.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {sizes.map((s) => (
            <div
              key={s.size}
              className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5"
            >
              <span className="text-xs font-bold text-text-primary w-8 shrink-0">
                {s.size}
              </span>
              <input
                type="number"
                min={0}
                value={s.qty || ""}
                placeholder="0"
                onChange={(e) => updateQty(s.size, Number(e.target.value))}
                className="w-full bg-transparent text-sm font-semibold text-text-primary outline-none text-right"
              />
              <span className="text-[10px] text-text-secondary shrink-0">pcs</span>
            </div>
          ))}
        </div>
      )}

      {sizes.length === 0 && (
        <p className="text-xs text-text-secondary bg-background rounded-lg border border-dashed border-border px-3 py-2 text-center">
          Select sizes above to enter stock quantities
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// IMAGE UPLOADER
// ═══════════════════════════════════════════════════════════════

function ImageUploader({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border bg-background p-3">
          <img
            src={value}
            alt="Product"
            className="w-full h-full object-contain"
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-surface/90 hover:bg-primary-light text-text-secondary hover:text-primary flex items-center justify-center shadow-sm border border-border"
          >
            <X size={13} />
          </button>
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/90 hover:bg-surface rounded-lg text-xs font-semibold text-text-primary shadow-sm border border-border"
            >
              <Upload size={12} /> Replace
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 bg-surface/90 hover:bg-surface rounded-lg text-xs font-semibold text-text-primary shadow-sm border border-border"
            >
              <Camera size={12} /> Camera
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className={`flex flex-col items-center justify-center gap-3 w-full aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer transition-all ${dragging
            ? "border-red-400 bg-coral-light"
            : "border-border bg-background hover:border-primary hover:bg-primary-light/50"
            }`}
        >
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center shadow-sm">
            <Camera size={20} className="text-text-secondary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">
              Click or drag image here
            </p>
            <p className="text-xs text-text-secondary mt-0.5">PNG, JPG up to 5MB</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-surface rounded-lg text-xs font-semibold text-text-primary shadow-sm border border-border"
              >
                <Upload size={12} /> Upload
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-surface rounded-lg text-xs font-semibold text-text-primary shadow-sm border border-border"
              >
                <Camera size={12} /> Camera
              </button>
            </div>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMPTY FORM
// ═══════════════════════════════════════════════════════════════

const EMPTY_FORM: Omit<Product, "id" | "createdDate"> = {
  name: "",
  category: "",
  brand: "",
  purchasePrice: 0,
  sellingPrice: 0,
  gstPercent: 5,
  minStockAlert: 5,
  description: "",
  sku: "",
  barcode: "",
  barcodeImageUrl: "",
  image: "",

  gender: "Men",
  fabric: "Cotton",
  color: "",
  sizes: [],

  unit: "pcs",
  expiryDate: "",
  mfgDate: "",
  hsnCode: "",
  stockQuantity: 0,

  invoiceNumber: "",
  purchaseDate: "",
};


// ═══════════════════════════════════════════════════════════════
// PRODUCT MODAL
// ═══════════════════════════════════════════════════════════════

function ProductModal({
  mode,
  product,
  onSave,
  onClose,
  storeCategory,
  store,
  nameSuggestions,
  categorySuggestions,
  genderSuggestions,
  brandSuggestions,
  fabricSuggestions,
  colorSuggestions,
  invoiceSuggestions,
  purchaseDateSuggestions,
}: {
  mode: "add" | "edit" | "view";
  product: Product | null;
  onSave: (p: Product) => void;
  onClose: () => void;
  storeCategory: "GARMENTS" | "GROCERY";
  store?: any;
  nameSuggestions: string[];
  categorySuggestions: string[];
  genderSuggestions: string[];
  brandSuggestions: string[];
  fabricSuggestions: string[];
  colorSuggestions: string[];
  invoiceSuggestions: string[];
  purchaseDateSuggestions: string[];
}) {
  const isView = mode === "view";
  const isGrocery = storeCategory === "GROCERY";

  const [form, setForm] = useState<Omit<Product, "id" | "createdDate">>(
    () => {
      if (product) {
        const { id, createdDate, ...rest } = product;
        return rest;
      }
      return {
        ...EMPTY_FORM,
        category: isGrocery ? GROCERY_CATEGORIES[0] : CLOTHING_CATEGORIES[0],
        sizes: []
      };
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!isGrocery) {
      if (!form.color?.trim()) e.color = "Required";
      if (!form.sizes || form.sizes.length === 0) e.sizes = "Select at least one size";
    } else {
      if (!form.unit?.trim()) e.unit = "Required";
    }
    if (!form.purchasePrice) e.purchasePrice = "Required";
    if (!form.sellingPrice) e.sellingPrice = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        category: form.category,
        brand: form.brand,
        purchase_price: form.purchasePrice,
        selling_price: form.sellingPrice,
        gst_percent: form.gstPercent,
        min_stock_level: form.minStockAlert,
        description: form.description,
        image_url: form.image,
        invoice_number: form.invoiceNumber,
        purchase_date: form.purchaseDate,
      };

      if (isGrocery) {
        payload.unit = form.unit;
        payload.hsn_code = form.hsnCode;
        payload.expiry_date = form.expiryDate;
        payload.mfg_date = form.mfgDate;
        payload.stock_quantity = form.stockQuantity;
      } else {
        payload.gender = form.gender;
        payload.fabric = form.fabric;
        payload.color = form.color;
        payload.sizes = form.sizes?.map(s => ({ size: s.size, quantity: s.qty }));
      }

      let res;
      if (mode === "add") {
        res = await api.post('/products', payload);
      } else {
        res = await api.put(`/products/${product?.id}`, payload);
      }

      const saved: Product = {
        ...product,
        ...form,
        id: res.data.id,
        barcode: res.data.barcode,
        barcodeImageUrl: res.data.barcode_image_url,
        createdDate: res.data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      } as Product;

      onSave(saved);
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  const marginVal =
    form.purchasePrice > 0
      ? Math.round(
        ((form.sellingPrice - form.purchasePrice) / form.purchasePrice) * 100
      )
      : 0;
  const withTax = Math.round(
    form.sellingPrice * (1 + form.gstPercent / 100)
  );
  const totalQty = form.sizes?.reduce((s, x) => s + (x.qty || 0), 0) || 0;

  function printBarcodeLabel(p: Product) {
    const barcodeValue = p.barcode;
    if (!barcodeValue) {
      alert("No barcode number available for this product.");
      return;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    try {
      JsBarcode(svg, barcodeValue, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 5,
      });
    } catch (error) {
      alert("Failed to draw barcode for printing.");
      return;
    }
    const barcodeSvg = svg.outerHTML;

    const html = `
      <html><head><title>Print Barcode - ${barcodeValue}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
        body { display: flex; flex-direction: column; items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; }
        .label-box { border: 2px dashed #ccc; padding: 15px; border-radius: 8px; width: 300px; display: flex; flex-direction: column; items: center; background: white; }
        .store-name { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 4px; }
        .product-name { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 8px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .barcode-container { margin-bottom: 8px; }
        .price { font-size: 16px; font-weight: 800; color: #dc2626; }
        @media print {
          body { padding: 0; }
          .label-box { border: none; }
        }
      </style>
      </head><body>
      <div class="label-box">
        <div class="store-name">🏪 ${store?.name || 'Stock Management'}</div>
        <div class="product-name">${p.name}</div>
        <div class="barcode-container">
          ${barcodeSvg}
        </div>
        <div class="price">₹${p.sellingPrice.toLocaleString("en-IN")}</div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 500);
        }
      </script>
      </body></html>
    `;

    const w = window.open("", "_blank", "width=450,height=400");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
  }

  // ── VIEW MODE ─────────────────────────────────────────────────
  if (isView && product) {
    const badge = getStockBadge(product);
    const total = totalStock(product);

    const sellingPrice = parseFloat(product.sellingPrice as any) || 0;
    const purchasePrice = parseFloat(product.purchasePrice as any) || 0;
    const gstPercent = parseFloat(product.gstPercent as any) || 0;
    const margin = sellingPrice - purchasePrice;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-[80%] bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[92vh] flex flex-col">

          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <ProductImage src={product.image} name={product.name} size="md" />
              <div>
                <h2 className="text-base font-bold text-text-primary">{product.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-text-secondary">#{product.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {!isGrocery && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                      {product.gender}
                    </span>
                  )}
                  {isGrocery && (
                    <span className="px-2 py-0.5 rounded-full bg-coral-light text-red-700 border border-coral text-xs font-semibold">
                      {product.unit}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-primary-light text-text-secondary hover:text-primary flex items-center justify-center transition-all bg-background"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

            {product.image && (
              <div className="w-full h-52 rounded-xl overflow-hidden border border-border bg-background p-3">
                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
              </div>
            )}

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-coral p-4">
              <p className="text-xs font-bold text-coral uppercase tracking-widest mb-3">Pricing</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">Selling Price</p>
                  {product.discountedPrice != null && product.discountedPrice < sellingPrice ? (
                    <div className="mt-0.5">
                      <p className="text-xl font-bold text-success">₹{product.discountedPrice.toLocaleString("en-IN")}</p>
                      <p className="text-xs line-through text-text-secondary">₹{sellingPrice.toLocaleString("en-IN")}</p>
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-primary mt-0.5">₹{sellingPrice.toLocaleString("en-IN")}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">Purchase Price</p>
                  <p className="text-xl font-bold text-text-primary mt-0.5">₹{purchasePrice.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">GST</p>
                  <p className="text-xl font-bold text-warning mt-0.5">{gstPercent}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">Margin</p>
                  <p className={`text-xl font-bold mt-0.5 ${margin >= 0 ? "text-success" : "text-primary"}`}>
                    ₹{margin.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">General Information</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {[
                  { label: "Brand", value: product.brand || "—" },
                  { label: "Category", value: product.category },
                  { label: "SKU", value: product.sku || "—" },
                  { label: "Min Stock Alert", value: `${product.minStockAlert} pcs` },
                  { label: "Total Stock", value: `${total} pcs` },
                  { label: "Added On", value: product.createdDate ? new Date(product.createdDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                  { label: "Invoice Number", value: product.invoiceNumber || "—" },
                  { label: "Purchase Date", value: product.purchaseDate ? new Date(product.purchaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                ].map((d) => (
                  <div key={d.label}>
                    <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">{d.label}</p>
                    <p className="text-sm text-text-primary font-semibold mt-0.5">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {!isGrocery && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Garment Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { label: "Gender", value: product.gender || "—" },
                    { label: "Fabric", value: product.fabric || "—" },
                    { label: "Color", value: product.color || "—" },
                  ].map((d) => (
                    <div key={d.label}>
                      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">{d.label}</p>
                      <p className="text-sm text-text-primary font-semibold mt-0.5">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isGrocery && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Grocery Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { label: "Unit", value: product.unit || "—" },
                    { label: "HSN Code", value: product.hsnCode || "—" },
                    { label: "Stock Qty", value: product.stockQuantity != null ? `${product.stockQuantity} units` : "—" },
                    { label: "Mfg. Date", value: product.mfgDate ? new Date(product.mfgDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                    { label: "Expiry Date", value: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                  ].map((d) => (
                    <div key={d.label}>
                      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">{d.label}</p>
                      <p className="text-sm text-text-primary font-semibold mt-0.5">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isGrocery && product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Size-wise Stock &amp; Barcodes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {product.sizes.map((s) => (
                    <div
                      key={s.size}
                      className={`flex flex-col p-3 rounded-xl border text-xs ${s.qty === 0 ? "bg-coral-light/60 border-coral" : "bg-background border-border"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-text-primary">{s.size}</span>
                        <span className={`font-bold text-xs px-1.5 py-0.5 rounded-full ${s.qty === 0 ? "bg-red-100 text-primary" : "bg-green-100 text-success"}`}>
                          {s.qty} pcs
                        </span>
                      </div>
                      {s.barcode && (
                        <div className="mt-1.5 flex flex-col items-center bg-surface rounded-lg border border-border p-2 text-center gap-1">
                          <Barcode value={s.barcode} className="h-9" />
                          <p className="text-[9px] font-mono text-text-secondary break-all">{s.barcode}</p>
                          <button
                            onClick={() => printBarcodeLabel({
                              ...product,
                              name: `${product.name} (${s.size})`,
                              barcode: s.barcode,
                            })}
                            className="flex items-center justify-center gap-1 w-full py-1 bg-background hover:bg-primary-light text-[10px] font-bold text-text-primary hover:text-red-700 rounded border border-border transition-colors"
                          >
                            <Printer size={9} /> Print
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isGrocery && product.barcode && (
              <div className="bg-background rounded-xl border border-border p-4">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Product Barcode</p>
                <div className="bg-surface rounded-lg border border-border p-4 flex flex-col items-center text-center max-w-xs mx-auto gap-2">
                  <Barcode value={product.barcode || ""} className="h-14" />
                  <p className="text-xs font-mono text-text-secondary font-semibold">{product.barcode}</p>
                  <button
                    onClick={() => printBarcodeLabel(product)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-background hover:bg-primary-light text-xs font-bold text-text-primary hover:text-red-700 rounded-lg border border-border transition-colors"
                  >
                    <Printer size={13} /> Print Label
                  </button>
                </div>
              </div>
            )}

            {product.description && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">Description</p>
                <p className="text-sm text-text-primary leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border shrink-0">
            <button
              onClick={onClose}
              className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }


  // ── ADD / EDIT FORM ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-[80%] bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[94vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {mode === "add" ? "Add New Product" : `Edit — ${product?.name}`}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {mode === "add"
                ? `Fill in ${isGrocery ? "grocery" : "clothing"} details below`
                : "Update product information"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-primary-light text-text-secondary hover:text-primary flex items-center justify-center transition-all bg-background"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-[1fr_260px] divide-x divide-slate-100">

            <div className="px-6 py-5 space-y-6">

              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Basic Information</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Product Name with Suggestions */}
                  <SuggestionInput
                    label="Product Name *"
                    value={form.name}
                    onChange={(v) => set("name", v)}
                    suggestions={nameSuggestions}
                    placeholder="e.g. Classic White Formal Shirt"
                    error={errors.name}
                    span={2}
                  />

                  <SuggestionInput
                    label="Category *"
                    value={form.category}
                    onChange={(v) => {
                      set("category", v);
                      if (!isGrocery) set("sizes", []);
                    }}
                    suggestions={categorySuggestions}
                    placeholder="e.g. T-Shirt, Shirt, Pant"
                  />

                  {!isGrocery ? (
                    <>
                      <SuggestionInput
                        label="Gender *"
                        value={form.gender || "Men"}
                        onChange={(v) => {
                          set("gender", v);
                          set("sizes", []);
                        }}
                        suggestions={genderSuggestions}
                        placeholder="e.g. Men, Women, Kids"
                      />
                      {/* Brand with Suggestions */}
                      <SuggestionInput
                        label="Brand"
                        value={form.brand || ""}
                        onChange={(v) => set("brand", v)}
                        suggestions={brandSuggestions}
                        placeholder="e.g. Levis, Zara, Biba"
                      />
                      <SuggestionInput
                        label="Fabric *"
                        value={form.fabric || "Cotton"}
                        onChange={(v) => set("fabric", v)}
                        suggestions={fabricSuggestions}
                        placeholder="e.g. Cotton, Denim"
                      />
                      {/* Color with Suggestions */}
                      <SuggestionInput
                        label="Color *"
                        value={form.color || ""}
                        onChange={(v) => set("color", v)}
                        suggestions={colorSuggestions}
                        placeholder="e.g. Navy Blue, Floral Pink"
                        error={errors.color}
                      />
                    </>
                  ) : (
                    <>
                      <SelectField
                        label="Unit *"
                        value={form.unit || "pcs"}
                        onChange={(v) => set("unit", v)}
                        options={UNITS}
                      />
                      <Field label="HSN Code">
                        <input
                          type="text"
                          placeholder="e.g. 1905"
                          value={form.hsnCode}
                          onChange={(e) => set("hsnCode", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="MFG Date">
                        <input
                          type="date"
                          value={form.mfgDate}
                          onChange={(e) => set("mfgDate", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Expiry Date">
                        <input
                          type="date"
                          value={form.expiryDate}
                          onChange={(e) => set("expiryDate", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      {/* Brand with Suggestions for Grocery too */}
                      <SuggestionInput
                        label="Brand"
                        value={form.brand || ""}
                        onChange={(v) => set("brand", v)}
                        suggestions={brandSuggestions}
                        placeholder="e.g. Nestle, Amul"
                      />
                    </>
                  )}

                  {/* Purchase Details — shown for both Grocery & Garments */}
                  <SuggestionInput
                    label="Invoice Number"
                    value={form.invoiceNumber}
                    onChange={(v) => set("invoiceNumber", v)}
                    suggestions={invoiceSuggestions}
                    placeholder="e.g. INV-001"
                  />
                  <Field label="Purchase Date">
                    <input
                      type="date"
                      value={form.purchaseDate}
                      onChange={(e) => set("purchaseDate", e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    {isGrocery ? "Stock Quantity *" : "Sizes & Stock *"}
                  </p>
                  {totalQty > 0 && (
                    <span className="text-xs font-semibold text-primary bg-coral-light border border-coral px-2 py-0.5 rounded-full">
                      Total: {totalQty} {isGrocery ? (form.unit || "pcs") : "pcs"}
                    </span>
                  )}
                </div>

                {isGrocery ? (
                  <Field label="Quantity">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={form.stockQuantity || ""}
                        onChange={(e) => set("stockQuantity", Number(e.target.value))}
                        className={inputCls}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">
                        {form.unit || "pcs"}
                      </span>
                    </div>
                  </Field>
                ) : (
                  <>
                    <SizeStockEditor
                      sizes={form.sizes || []}
                      category={form.category}
                      gender={form.gender || "Men"}
                      onChange={(s) => { set("sizes", s); setErrors((e) => { const n = { ...e }; delete n.sizes; return n; }); }}
                    />
                    {errors.sizes && (
                      <p className="text-[11px] text-coral mt-1">{errors.sizes}</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Pricing</p>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Purchase Price (₹) *">
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={form.purchasePrice || ""}
                        onChange={(e) => set("purchasePrice", Number(e.target.value))}
                        className={`${inputCls} pl-8 ${errors.purchasePrice ? "border-red-400 bg-coral-light" : ""}`}
                      />
                    </div>
                    {errors.purchasePrice && <p className="text-[11px] text-coral">{errors.purchasePrice}</p>}
                  </Field>

                  <Field label="Selling Price (₹) *">
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={form.sellingPrice || ""}
                        onChange={(e) => set("sellingPrice", Number(e.target.value))}
                        className={`${inputCls} pl-8 ${errors.sellingPrice ? "border-red-400 bg-coral-light" : ""}`}
                      />
                    </div>
                    {errors.sellingPrice && <p className="text-[11px] text-coral">{errors.sellingPrice}</p>}
                  </Field>

                  <Field label="GST %">
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                      <select
                        value={form.gstPercent}
                        onChange={(e) => set("gstPercent", Number(e.target.value))}
                        className={`${inputCls} pl-8 appearance-none pr-8 cursor-pointer`}
                      >
                        {GST_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}%</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                  </Field>
                </div>

                {(form.purchasePrice > 0 || form.sellingPrice > 0) && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-background rounded-lg border border-border px-3 py-2 text-center">
                      <p className="text-xs text-text-secondary">Margin</p>
                      <p className={`text-sm font-bold ${marginVal >= 0 ? "text-success" : "text-primary"}`}>
                        {marginVal}%
                      </p>
                    </div>
                    <div className="bg-background rounded-lg border border-border px-3 py-2 text-center">
                      <p className="text-xs text-text-secondary">Profit/Unit</p>
                      <p className={`text-sm font-bold ${form.sellingPrice - form.purchasePrice >= 0 ? "text-success" : "text-primary"}`}>
                        {fmt(form.sellingPrice - form.purchasePrice)}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg border border-indigo-100 px-3 py-2 text-center">
                      <p className="text-xs text-indigo-500">With GST</p>
                      <p className="text-sm font-bold text-indigo-700">{fmt(withTax)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Extra</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Min Stock Alert">
                    <input
                      type="number"
                      min={0}
                      placeholder="5"
                      value={form.minStockAlert || ""}
                      onChange={(e) => set("minStockAlert", Number(e.target.value))}
                      className={inputCls}
                    />
                  </Field>
                  <div />
                  <Field label="Description" span={2}>
                    <textarea
                      placeholder="Fabric details, care instructions, style notes…"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={3}
                      className={textareaCls}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Product Image</p>
              <ImageUploader value={form.image} onChange={(url) => set("image", url)} />
              <div className="mt-5 space-y-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Tips</p>
                {[
                  "Use a clean white background",
                  "Show full garment front view",
                  "PNG or JPG recommended",
                  "Max 5MB file size",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-text-secondary">{t}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-10 rounded-lg bg-primary hover:bg-red-700 text-sm font-semibold text-white transition-colors shadow-sm shadow-red-200 flex items-center justify-center gap-2"
          >
            <CheckCircle size={15} />
            {mode === "add" ? "Add Product" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const storeId = localStorage.getItem('activeStoreId');
        if (storeId) {
          const storeRes = await api.get(`/stores/${storeId}`);
          setStore(storeRes.data);
        }

        const res = await api.get('/products');
        const mapped = res.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          gender: p.gender,
          brand: p.brand,
          fabric: p.fabric,
          color: p.color,
          unit: p.unit,
          expiryDate: p.expiry_date,
          mfgDate: p.mfg_date,
          hsnCode: p.hsn_code,
          stockQuantity: p.stock_quantity,
          purchasePrice: parseFloat(p.purchase_price),
          sellingPrice: parseFloat(p.selling_price),
          discountedPrice: p.discounted_price != null ? parseFloat(p.discounted_price) : null,
          discountPercent: p.discount_percent != null ? parseFloat(p.discount_percent) : null,
          gstPercent: parseFloat(p.gst_percent),
          minStockAlert: p.min_stock_level,
          description: p.description,
          sku: p.sku,
          barcode: p.barcode,
          barcodeImageUrl: p.barcode_image_url,
          image: p.image_url,
          createdDate: p.created_at?.split('T')[0],
          invoiceNumber: p.invoice_number,
          purchaseDate: p.purchase_date,
          sizes: p.sizes?.map((s: any) => ({
            size: s.size,
            qty: s.quantity,
            barcode: s.barcode,
            barcodeImageUrl: s.barcode_image_url,
          })) || []
        }));
        setProducts(mapped);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("createdDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isGrocery = store?.category === "GROCERY";

  const inStockCount = products.filter((p) => getStockBadge(p).label === "In Stock").length;
  const lowCount = products.filter((p) => getStockBadge(p).label === "Low Stock").length;
  const outCount = products.filter((p) => getStockBadge(p).label === "Out of Stock").length;
  const totalValue = products.reduce((t, p) => t + totalStock(p) * p.purchasePrice, 0);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  // Dynamic suggestions derived from existing products
  const nameSuggestions = useMemo(() =>
    Array.from(new Set(products.map((p) => p.name).filter(Boolean))),
    [products]);

  const categorySuggestions = useMemo(() =>
    Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]);

  const genderSuggestions = useMemo(() =>
    Array.from(new Set(products.map((p) => p.gender).filter(Boolean))),
    [products]);

  const brandSuggestions = useMemo(() =>
    Array.from(new Set(products.map((p) => p.brand).filter(Boolean))),
    [products]);

  const fabricSuggestions = useMemo(() =>
    Array.from(new Set(products.map((p) => p.fabric).filter(Boolean))),
    [products]);

  const colorSuggestions = useMemo(() =>
    Array.from(new Set(products.map((p) => p.color).filter(Boolean))),
    [products]);

  const invoiceSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.invoiceNumber)
            .filter(Boolean)
        )
      ),
    [products]
  );

  const purchaseDateSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.purchaseDate)
            .filter(Boolean)
        )
      ),
    [products]
  );

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.color?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.invoiceNumber?.toLowerCase().includes(q) ||
          p.sizes?.some((s: any) => s.barcode?.toLowerCase().includes(q));
        const matchCat = catFilter === "All" || p.category === catFilter;
        const matchGender = isGrocery || genderFilter === "All" || p.gender === genderFilter;
        const badge = getStockBadge(p).label;
        const matchStock = stockFilter === "All" || badge === stockFilter;
        return matchSearch && matchCat && matchGender && matchStock;
      })
      .sort((a, b) => {
        let va: number | string = 0,
          vb: number | string = 0;
        if (sortKey === "name") { va = a.name; vb = b.name; }
        if (sortKey === "totalStock") { va = totalStock(a); vb = totalStock(b); }
        if (sortKey === "sellingPrice") { va = a.sellingPrice; vb = b.sellingPrice; }
        if (sortKey === "createdDate") { va = a.createdDate; vb = b.createdDate; }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, search, catFilter, genderFilter, stockFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleSave(p: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [p, ...prev];
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteId(null);
    } catch (error: any) {
      alert(error.message || "Failed to delete product");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-secondary">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{isGrocery ? "Grocery Inventory" : "Clothing Products"}</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {products.length} items · {fmt(totalValue)} inventory value
            </p>
          </div>
          <button
            onClick={() => { setSelected(null); setModal("add"); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard index={0} label="Total Products" value={products.length} sub="All categories" icon={Package} bg="bg-coral-light" ic="text-primary" />
          <StatCard index={1} label="In Stock" value={inStockCount} sub="Available" icon={CheckCircle} bg="bg-mint-light" ic="text-success" />
          <StatCard index={2} label="Low / Out" value={`${lowCount} / ${outCount}`} sub="Need attention" icon={AlertTriangle} bg="bg-warning/10" ic="text-warning" highlight={lowCount + outCount > 0} />
          <StatCard index={3} label="Inventory Value" value={fmt(totalValue)} sub="At purchase price" icon={BarChart3} bg="bg-purple-50" ic="text-purple-600" />
        </div>

        {(lowCount > 0 || outCount > 0) && (
          <div className="flex items-start gap-3 bg-warning/10 rounded-xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">Stock Alert</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {products
                  .filter((p) => getStockBadge(p).label !== "In Stock")
                  .map((p) => {
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelected(p); setModal("view"); }}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-red-600 text-white border border-red-600 transition-all duration-150 ease-out hover:scale-[1.03] hover:bg-red-700 shadow-sm"
                      >
                        {p.name} — {totalStock(p) === 0 ? "OUT" : `${totalStock(p)} left`}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search name, brand, color, SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputCls + " pl-9"}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className={inputCls + " w-40 appearance-none pr-8 cursor-pointer"}
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>

          {!isGrocery && (
            <div className="relative">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className={inputCls + " w-32 appearance-none pr-8 cursor-pointer"}
              >
                {["All", ...GENDERS].map((g) => <option key={g}>{g}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={inputCls + " w-40 appearance-none pr-8 cursor-pointer"}
            >
              {["All", "In Stock", "Low Stock", "Out of Stock"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>

          <div className="flex gap-1 bg-background rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`w-9 h-8 rounded-md flex items-center justify-center transition-all ${viewMode === "table" ? "bg-surface text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`w-9 h-8 rounded-md flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
            >
              <Grid3X3 size={15} />
            </button>
          </div>
        </div>

        {viewMode === "table" && (
          <div className="glass-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-text-primary">
                        Product <ArrowUpDown size={12} className={sortKey === "name" ? "text-coral" : ""} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{isGrocery ? "Category / Unit" : "Category / Gender"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{isGrocery ? "Brand / HSN" : "Fabric / Color"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      <button onClick={() => toggleSort("sellingPrice")} className="flex items-center gap-1 hover:text-text-primary">
                        Pricing <ArrowUpDown size={12} className={sortKey === "sellingPrice" ? "text-coral" : ""} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{isGrocery ? "Dates" : "Sizes"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      <button onClick={() => toggleSort("totalStock")} className="flex items-center gap-1 hover:text-text-primary">
                        Stock <ArrowUpDown size={12} className={sortKey === "totalStock" ? "text-coral" : ""} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-text-secondary">
                          <Shirt size={36} className="text-slate-200" />
                          <p className="text-sm font-medium">No products found</p>
                          <button
                            onClick={() => { setSearch(""); setCatFilter("All"); setGenderFilter("All"); setStockFilter("All"); }}
                            className="text-xs text-primary hover:underline"
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const badge = getStockBadge(p);
                      const m = marginPct(p);
                      const tot = totalStock(p);
                      return (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-background transition-colors group">
                          <td className="px-4 py-3">
                            <ProductImage src={p.image} name={p.name} size="sm" />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-text-primary whitespace-nowrap">{p.name}</p>
                            <p className="text-xs font-mono text-text-secondary mt-0.5">#{p.id}</p>
                            {p.sku && (
                              <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                                <Tag size={9} />
                                <span className="font-mono">{p.sku}</span>
                              </p>
                            )}
                            {isGrocery && p.barcode && (
                              <div className="mt-1.5" title={`System Barcode: ${p.barcode}`}>
                                <Barcode value={p.barcode || ""} className="h-6" />
                              </div>
                            )}
                            {!isGrocery && p.sizes?.some((s: any) => s.barcode) && (
                              <span className="text-[10px] text-text-secondary font-semibold bg-background px-1.5 py-0.5 rounded mt-1.5 inline-block">
                                🏷️ Barcodes per size
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm text-text-primary">{p.category}</p>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${isGrocery ? "bg-coral-light text-red-700 border border-coral" : "bg-purple-50 text-purple-700 border border-purple-100"}`}>
                              {isGrocery ? p.unit : p.gender}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm text-text-primary">{isGrocery ? p.brand : p.fabric}</p>
                            <p className="text-xs text-text-secondary">{isGrocery ? `HSN: ${p.hsnCode || 'N/A'}` : p.color}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {p.discountedPrice != null && p.discountedPrice < p.sellingPrice ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-success text-sm">{fmt(p.discountedPrice)}</span>
                                  <span className="line-through text-text-secondary text-xs">{fmt(p.sellingPrice)}</span>
                                </div>
                                {p.discountPercent != null && (
                                  <span className="inline-block text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                                    {p.discountPercent}% OFF
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="font-bold text-text-primary">{fmt(p.sellingPrice)}</p>
                            )}
                            <p className="text-xs text-text-secondary">Cost: {fmt(p.purchasePrice)}</p>
                            <p className={`text-xs font-semibold ${m >= 0 ? "text-success" : "text-coral"}`}>
                              {m >= 0 ? "+" : ""}{m}% margin
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {isGrocery ? (
                              <div className="space-y-0.5">
                                {p.mfgDate && <p className="text-[10px] text-text-secondary">MFG: {p.mfgDate}</p>}
                                {p.expiryDate && (
                                  <p className={`text-[10px] font-bold ${new Date(p.expiryDate) < new Date() ? 'text-coral' : 'text-warning'}`}>
                                    EXP: {p.expiryDate}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {p.sizes?.slice(0, 4).map((s) => (
                                  <span
                                    key={s.size}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.qty === 0
                                      ? "bg-coral-light text-coral border-coral"
                                      : "bg-background text-text-primary border-border"
                                      }`}
                                  >
                                    {s.size}
                                  </span>
                                ))}
                                {p.sizes && p.sizes.length > 4 && (
                                  <span className="text-[10px] text-text-secondary px-1">
                                    +{p.sizes.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className={`font-bold ${badge.label === "Out of Stock" ? "text-coral" : badge.label === "Low Stock" ? "text-warning" : "text-text-primary"}`}>
                              {tot} pcs
                            </p>
                            <p className="text-xs text-text-secondary">Alert at {p.minStockAlert}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setSelected(p); setModal("view"); }}
                                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-red-800"
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                onClick={() => { setSelected(p); setModal("edit"); }}
                                className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
                              >
                                <Pencil size={13} /> Edit
                              </button>
                              <button
                                onClick={() => setDeleteId(p.id)}
                                className="flex items-center gap-1 text-xs font-medium text-coral hover:text-primary"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border bg-background">
              <p className="text-xs text-text-secondary">
                Showing{" "}
                <span className="font-semibold text-text-primary">{filtered.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-text-primary">{products.length}</span>{" "}
                products
              </p>
            </div>
          </div>
        )}

        {viewMode === "grid" && (
          <>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-text-secondary">
                <Shirt size={40} className="text-slate-200" />
                <p className="text-sm font-medium">No products found</p>
                <button
                  onClick={() => { setSearch(""); setCatFilter("All"); setGenderFilter("All"); setStockFilter("All"); }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filtered.map((p) => {
                  const badge = getStockBadge(p);
                  const m = marginPct(p);
                  const tot = totalStock(p);
                  return (
                    <div
                      key={p.id}
                      className="glass-panel !rounded overflow-hidden hover:border-coral hover:shadow-md transition-all group"
                    >
                      <div className="relative w-full aspect-[3/4] bg-background border-b border-border p-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Shirt size={36} className="text-slate-200" />
                          </div>
                        )}
                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {!isGrocery && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {p.gender}
                          </span>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="font-bold text-text-primary leading-tight line-clamp-2">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-secondary">{p.category}</span>
                            {!isGrocery && (
                              <>
                                <span className="text-slate-200">·</span>
                                <span className="text-xs text-text-secondary">{p.fabric}</span>
                              </>
                            )}
                          </div>
                          {!isGrocery && <p className="text-xs text-text-secondary mt-0.5">{p.color}</p>}
                          {isGrocery && p.expiryDate && (
                            <p className={`text-[10px] font-bold mt-1 ${new Date(p.expiryDate) < new Date() ? 'text-coral' : 'text-warning'}`}>
                              EXP: {p.expiryDate}
                            </p>
                          )}
                        </div>

                        {!isGrocery && p.sizes && (
                          <div className="flex flex-wrap gap-1">
                            {p.sizes.map((s) => (
                              <span
                                key={s.size}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.qty === 0
                                  ? "bg-coral-light text-coral border-coral"
                                  : "bg-background text-text-primary border-border"
                                  }`}
                              >
                                {s.size}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-background rounded-lg p-2 text-center">
                            <p className="text-xs text-text-secondary">Selling</p>
                            {p.discountedPrice != null && p.discountedPrice < p.sellingPrice ? (
                              <div>
                                <p className="text-sm font-bold text-success">{fmt(p.discountedPrice)}</p>
                                <p className="text-[10px] line-through text-text-secondary">{fmt(p.sellingPrice)}</p>
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-text-primary">{fmt(p.sellingPrice)}</p>
                            )}
                          </div>
                          <div className="bg-background rounded-lg p-2 text-center">
                            <p className="text-xs text-text-secondary">Stock</p>
                            <p className={`text-sm font-bold ${badge.label === "Out of Stock" ? "text-coral" : badge.label === "Low Stock" ? "text-warning" : "text-text-primary"}`}>
                              {tot} {isGrocery ? p.unit : "pcs"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${m >= 0 ? "text-success" : "text-coral"}`}>
                            {m >= 0 ? "+" : ""}{m}% margin
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">
                            {p.gstPercent}% GST
                          </span>
                        </div>

                        {isGrocery && p.barcode && (
                          <div className="py-1.5 flex justify-center bg-background/50 rounded-lg border border-border">
                            <Barcode value={p.barcode || ""} className="h-8" />
                          </div>
                        )}
                        {!isGrocery && p.sizes?.some((s: any) => s.barcode) && (
                          <div className="py-1.5 flex justify-center bg-background/50 rounded-lg border border-border">
                            <span className="text-[10px] text-text-secondary font-semibold">
                              🏷️ Barcodes per size
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1 border-t border-border">
                          <button
                            onClick={() => { setSelected(p); setModal("view"); }}
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-background hover:bg-primary-light text-xs font-semibold text-text-primary hover:text-red-700 transition-colors"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            onClick={() => { setSelected(p); setModal("edit"); }}
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-background hover:bg-background text-xs font-semibold text-text-primary transition-colors"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="w-8 h-8 rounded-lg bg-background hover:bg-primary-light text-text-secondary hover:text-coral flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {modal && (
        <ProductModal
          mode={modal}
          product={selected}
          onSave={handleSave}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          storeCategory={store?.category || "GARMENTS"}
          store={store}
          nameSuggestions={nameSuggestions}
          categorySuggestions={categorySuggestions}
          genderSuggestions={genderSuggestions}
          brandSuggestions={brandSuggestions}
          fabricSuggestions={fabricSuggestions}
          colorSuggestions={colorSuggestions}
          invoiceSuggestions={invoiceSuggestions}
          purchaseDateSuggestions={purchaseDateSuggestions}
        />
      )}

      {deleteId &&
        (() => {
          const p = products.find((x) => x.id === deleteId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="px-6 py-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <Trash2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Delete Product?</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      <span className="font-semibold text-text-primary">{p?.name}</span> will be permanently removed.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-5">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteId)}
                    className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary text-sm font-semibold text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}