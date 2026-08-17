"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BadgePercent,
    Boxes,
    CheckCircle2,
    ChevronDown,
    Filter,
    Loader2,
    Package,
    Percent,
    Plus,
    Search,
    Sparkles,
    Tag,
    Trash2,
    Layers3,
    X,
    Save,
    Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type DiscountType = "percentage" | "flat";
type RuleStatus = "active" | "scheduled" | "inactive";

type Product = {
    id: string;
    name: string;
    sku: string;
    brand: string;
    category: string;
    price: number;
    stock: number;
    discounted_price?: number | null;
    bulk_offer?: string | null;
};

type CategoryRule = {
    id: string;
    category: string;
    discountType: DiscountType;
    value: number;
    appliesToAllBrands: boolean;
    status: RuleStatus;
};

type BrandRule = {
    id: string;
    brand: string;
    discountType: DiscountType;
    value: number;
    status: RuleStatus;
};

type BulkRule = {
    id: string;
    title: string;
    selectedProductIds: string[];
    discountType: DiscountType;
    value: number;
    minQty: number;
    status: RuleStatus;
};

const inputCls =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-colors";

const selectCls =
    "h-10 w-full rounded-lg border border-border bg-background px-3 pr-9 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-colors";

const labelCls = "text-xs font-semibold text-text-secondary uppercase tracking-wide";

function money(n: number) {
    return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function uid(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

// ═══════════════════════════════════════════════════════════
// MOCK FALLBACKS
// ═══════════════════════════════════════════════════════════

const mockProducts: Product[] = [
    { id: "P-101", name: "Premium T-Shirt", sku: "TEE-001", brand: "UrbanThread", category: "Apparel", price: 1299, stock: 40, discounted_price: null },
    { id: "P-102", name: "Denim Jeans", sku: "JNS-102", brand: "BlueForge", category: "Apparel", price: 2499, stock: 18, discounted_price: null },
    { id: "P-103", name: "Running Shoes", sku: "SHO-210", brand: "SprintX", category: "Footwear", price: 3999, stock: 26, discounted_price: null },
    { id: "P-104", name: "Sports Cap", sku: "CAP-088", brand: "UrbanThread", category: "Accessories", price: 699, stock: 60, discounted_price: null },
    { id: "P-105", name: "Leather Wallet", sku: "ACC-302", brand: "HideCraft", category: "Accessories", price: 1499, stock: 22, discounted_price: null },
    { id: "P-106", name: "Casual Shirt", sku: "SRT-411", brand: "UrbanThread", category: "Apparel", price: 1799, stock: 35, discounted_price: null },
    { id: "P-107", name: "Sneakers Pro", sku: "SHO-240", brand: "SprintX", category: "Footwear", price: 4599, stock: 12, discounted_price: null },
    { id: "P-108", name: "Analog Watch", sku: "WAT-710", brand: "TimeNest", category: "Accessories", price: 3299, stock: 9, discounted_price: null },
];

const mockCategoryRules: CategoryRule[] = [
    { id: "CAT-1", category: "Apparel", discountType: "percentage", value: 12, appliesToAllBrands: true, status: "active" },
    { id: "CAT-2", category: "Footwear", discountType: "flat", value: 300, appliesToAllBrands: true, status: "scheduled" },
];

const mockBrandRules: BrandRule[] = [
    { id: "BR-1", brand: "UrbanThread", discountType: "percentage", value: 10, status: "active" },
    { id: "BR-2", brand: "SprintX", discountType: "flat", value: 250, status: "active" },
];

const mockBulkRules: BulkRule[] = [
    { id: "BK-1", title: "Apparel Launch Push", selectedProductIds: ["P-101", "P-102", "P-106"], discountType: "percentage", value: 15, minQty: 3, status: "active" },
];

// ═══════════════════════════════════════════════════════════
// SMALL UI HELPERS
// ═══════════════════════════════════════════════════════════

function StatusPill({ status }: { status: RuleStatus }) {
    const cls =
        status === "active"
            ? "bg-mint-light text-success"
            : status === "scheduled"
                ? "bg-warning/10 text-warning"
                : "bg-background text-text-secondary";

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-success" : status === "scheduled" ? "bg-warning" : "bg-text-secondary"}`} />
            {status === "active" ? "Active" : status === "scheduled" ? "Scheduled" : "Inactive"}
        </span>
    );
}

function DiscountValue({ type, value }: { type: DiscountType; value: number }) {
    return (
        <span className="font-bold text-text-primary">
            {type === "percentage" ? `${value}%` : money(value)}
        </span>
    );
}

function SectionCard({
    title,
    subtitle,
    icon: Icon,
    children,
    action,
}: {
    title: string;
    subtitle: string;
    icon: any;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="glass-panel p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
                        <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
                    </div>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function DiscountPage() {
    const { theme } = useTheme();
    const isEnterprise = theme === "enterprise";

    const [loading, setLoading] = useState(true);
    const [categoryRuleLoading, setCategoryRuleLoading] = useState(false);
    const [categoryRuleError, setCategoryRuleError] = useState<string | null>(null);
    const [categoryRuleSuccess, setCategoryRuleSuccess] = useState<string | null>(null);
    const [brandRuleLoading, setBrandRuleLoading] = useState(false);
    const [brandRuleError, setBrandRuleError] = useState<string | null>(null);
    const [brandRuleSuccess, setBrandRuleSuccess] = useState<string | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
    const [brandRules, setBrandRules] = useState<BrandRule[]>([]);
    const [bulkRules, setBulkRules] = useState<BulkRule[]>([]);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [brandFilter, setBrandFilter] = useState("All");

    const [categoryForm, setCategoryForm] = useState({
        category: "",
        discountType: "percentage" as DiscountType,
        value: "",
        appliesToAllBrands: true,
        status: "active" as RuleStatus,
    });

    const [brandForm, setBrandForm] = useState({
        brand: "",
        discountType: "percentage" as DiscountType,
        value: "",
        status: "active" as RuleStatus,
    });

    const [bulkForm, setBulkForm] = useState({
        title: "",
        discountType: "percentage" as DiscountType,
        value: "",
        minQty: "2",
        status: "active" as RuleStatus,
    });

    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    const fetchProducts = useCallback(async () => {
        try {
            console.log("[API GET /products] Fetching products...");
            const res = await api.get("/products");
            console.log("[API GET /products Success] Response:", res.data);
            const mapped = (res.data || []).map((p: any) => ({
                id: String(p.id),
                name: p.name,
                sku: p.sku || `SKU-${p.id}`,
                brand: p.brand || "Unbranded",
                category: p.category || "General",
                price: Number(p.selling_price || p.price || 0),
                stock: Number(p.stock_quantity || p.stock || 0),
                discounted_price: p.discounted_price != null ? Number(p.discounted_price) : null,
            }));
            setProducts(mapped.length ? mapped : mockProducts);
        } catch (err) {
            console.error("[API GET /products Error]:", err);
            setProducts(mockProducts);
        }
    }, []);

    const fetchCategoryRules = useCallback(async () => {
        try {
            console.log("[API GET /discounts/category] Fetching category rules...");
            const res = await api.get("/discounts/category");
            console.log("[API GET /discounts/category Success] Response:", res.data);
            const mapped = (res.data || []).map((r: any) => ({
                id: String(r.id),
                category: r.target,
                discountType: r.discount_type as DiscountType,
                value: Number(r.value),
                appliesToAllBrands: r.applies_to_all_brands,
                status: r.status as RuleStatus,
            }));
            setCategoryRules(mapped);
        } catch (err) {
            console.error("[API GET /discounts/category Error]:", err);
            setCategoryRules(mockCategoryRules);
        }
    }, []);

    const fetchBrandRules = useCallback(async () => {
        try {
            console.log("[API GET /discounts/brand] Fetching brand rules...");
            const res = await api.get("/discounts/brand");
            console.log("[API GET /discounts/brand Success] Response:", res.data);
            const mapped = (res.data || []).map((r: any) => ({
                id: String(r.id),
                brand: r.target,
                discountType: r.discount_type as DiscountType,
                value: Number(r.value),
                status: r.status as RuleStatus,
            }));
            setBrandRules(mapped);
        } catch (err) {
            console.error("[API GET /discounts/brand Error]:", err);
            setBrandRules(mockBrandRules);
        }
    }, []);

    useEffect(() => {
        async function fetchDiscountData() {
            try {
                setLoading(true);
                await Promise.all([fetchProducts(), fetchCategoryRules(), fetchBrandRules()]);
                setBulkRules(mockBulkRules);
            } catch {
                setProducts(mockProducts);
                setCategoryRules(mockCategoryRules);
                setBrandRules(mockBrandRules);
                setBulkRules(mockBulkRules);
            } finally {
                setLoading(false);
            }
        }
        fetchDiscountData();
    }, [fetchProducts, fetchCategoryRules, fetchBrandRules]);

    const categories = useMemo(
        () => Array.from(new Set(products.map((p) => p.category))).sort(),
        [products]
    );

    const brands = useMemo(
        () => Array.from(new Set(products.map((p) => p.brand))).sort(),
        [products]
    );

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const q = search.toLowerCase();
            const searchMatch =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q);

            const categoryMatch = categoryFilter === "All" || p.category === categoryFilter;
            const brandMatch = brandFilter === "All" || p.brand === brandFilter;

            return searchMatch && categoryMatch && brandMatch;
        });
    }, [products, search, categoryFilter, brandFilter]);

    const stats = useMemo(() => {
        const activeRules = categoryRules.filter((r) => r.status === "active").length
            + brandRules.filter((r) => r.status === "active").length
            + bulkRules.filter((r) => r.status === "active").length;

        return {
            totalProducts: products.length,
            activeRules,
            categoryRules: categoryRules.length,
            brandRules: brandRules.length,
        };
    }, [products, categoryRules, brandRules, bulkRules]);

    function resetCategoryForm() {
        setCategoryForm({
            category: "",
            discountType: "percentage",
            value: "",
            appliesToAllBrands: true,
            status: "active",
        });
    }

    function resetBrandForm() {
        setBrandForm({
            brand: "",
            discountType: "percentage",
            value: "",
            status: "active",
        });
    }

    function resetBulkForm() {
        setBulkForm({
            title: "",
            discountType: "percentage",
            value: "",
            minQty: "2",
            status: "active",
        });
        setSelectedProducts([]);
    }

    async function addCategoryRule() {
        if (!categoryForm.category || !categoryForm.value) return;

        setCategoryRuleLoading(true);
        setCategoryRuleError(null);
        setCategoryRuleSuccess(null);

        try {
            const payload = {
                category: categoryForm.category,
                discount_type: categoryForm.discountType,
                value: Number(categoryForm.value),
                status: categoryForm.status,
                applies_to_all_brands: categoryForm.appliesToAllBrands,
            };
            console.log("[API POST /discounts/category] Request payload:", payload);
            const res = await api.post("/discounts/category", payload);
            console.log("[API POST /discounts/category Success] Response:", res.data);

            // Add the returned rule to the list
            const r = res.data.rule;
            const newRule: CategoryRule = {
                id: String(r.id),
                category: r.target,
                discountType: r.discount_type as DiscountType,
                value: Number(r.value),
                appliesToAllBrands: r.applies_to_all_brands,
                status: r.status as RuleStatus,
            };
            setCategoryRules((prev) => {
                // Replace any existing rule for same category
                const filtered = prev.filter((x) => x.category !== newRule.category);
                return [newRule, ...filtered];
            });

            // Re-fetch products so discounted_price column updates
            await fetchProducts();

            setCategoryRuleSuccess(`Discount applied to ${res.data.affectedCount} product(s) in "${categoryForm.category}".`);
            resetCategoryForm();

            // Auto-clear success toast
            setTimeout(() => setCategoryRuleSuccess(null), 4000);
        } catch (err: any) {
            console.error("[API POST /discounts/category Error]:", err);
            setCategoryRuleError(err.message || "Failed to apply discount.");
            setTimeout(() => setCategoryRuleError(null), 5000);
        } finally {
            setCategoryRuleLoading(false);
        }
    }

    async function addBrandRule() {
        if (!brandForm.brand || !brandForm.value) return;

        setBrandRuleLoading(true);
        setBrandRuleError(null);
        setBrandRuleSuccess(null);

        try {
            const payload = {
                brand: brandForm.brand,
                discount_type: brandForm.discountType,
                value: Number(brandForm.value),
                status: brandForm.status,
            };
            console.log("[API POST /discounts/brand] Request payload:", payload);
            const res = await api.post("/discounts/brand", payload);
            console.log("[API POST /discounts/brand Success] Response:", res.data);

            const r = res.data.rule;
            const newRule: BrandRule = {
                id: String(r.id),
                brand: r.target,
                discountType: r.discount_type as DiscountType,
                value: Number(r.value),
                status: r.status as RuleStatus,
            };
            setBrandRules((prev) => {
                // Replace any existing rule for the same brand
                const filtered = prev.filter((x) => x.brand !== newRule.brand);
                return [newRule, ...filtered];
            });

            // Re-fetch products so discounted_price column updates
            await fetchProducts();

            setBrandRuleSuccess(`Discount applied to ${res.data.affectedCount} product(s) for brand "${brandForm.brand}".`);
            resetBrandForm();

            setTimeout(() => setBrandRuleSuccess(null), 4000);
        } catch (err: any) {
            console.error("[API POST /discounts/brand Error]:", err);
            setBrandRuleError(err.message || "Failed to apply brand discount.");
            setTimeout(() => setBrandRuleError(null), 5000);
        } finally {
            setBrandRuleLoading(false);
        }
    }

    function addBulkRule() {
        if (!bulkForm.title.trim() || !bulkForm.value || selectedProducts.length === 0) return;

        const val = Number(bulkForm.value);
        const minQty = Number(bulkForm.minQty || 1);
        const offerText = bulkForm.discountType === "percentage"
            ? `Buy ${minQty} & get ${val}% off`
            : `Buy ${minQty} & get ${money(val)} off`;

        const newRule: BulkRule = {
            id: uid("BK"),
            title: bulkForm.title.trim(),
            selectedProductIds: selectedProducts,
            discountType: bulkForm.discountType,
            value: val,
            minQty: minQty,
            status: bulkForm.status,
        };

        setBulkRules((prev) => [newRule, ...prev]);

        // Calculate single unit discounted price based on the bulk discount rate
        setProducts((prevProducts) =>
            prevProducts.map((p) => {
                if (selectedProducts.includes(p.id)) {
                    let calcPrice = p.price;
                    if (bulkForm.discountType === "percentage") {
                        calcPrice = Math.max(0, Math.round(p.price * (1 - val / 100)));
                    } else {
                        calcPrice = Math.max(0, p.price - val);
                    }
                    return {
                        ...p,
                        discounted_price: calcPrice,
                        bulk_offer: offerText,
                    } as any;
                }
                return p;
            })
        );

        resetBulkForm();
    }

    function toggleProduct(id: string) {
        setSelectedProducts((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function selectFilteredProducts() {
        setSelectedProducts(filteredProducts.map((p) => p.id));
    }

    function clearSelectedProducts() {
        setSelectedProducts([]);
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-text-secondary">Loading discounts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Discount Management</h1>
                    <p className="text-sm text-text-secondary mt-0.5">
                        Create category-wise, brand-wise, and bulk product discounts
                    </p>
                </div>

                <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary hover:bg-red-700 text-sm font-semibold text-white transition-colors shadow-sm shadow-red-200">
                    <Save size={16} />
                    Save Rules
                </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Products", value: stats.totalProducts, sub: "Eligible products", icon: Package },
                    { label: "Active Rules", value: stats.activeRules, sub: "Live discount rules", icon: Sparkles },
                    { label: "Category Rules", value: stats.categoryRules, sub: "Category-wise pricing", icon: Layers3 },
                    { label: "Brand Rules", value: stats.brandRules, sub: "Brand campaigns", icon: Building2 },
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

            {/* Top layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Category rule */}
                <SectionCard
                    title="Category Discount"
                    subtitle="Apply discount across a full product category"
                    icon={Layers3}
                >
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className={labelCls}>Category</label>
                            <div className="relative">
                                <select
                                    value={categoryForm.category}
                                    onChange={(e) => setCategoryForm((p) => ({ ...p, category: e.target.value }))}
                                    className={selectCls}
                                >
                                    <option value="">Select category</option>
                                    {categories.map((c) => <option key={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Discount Type</label>
                                <div className="relative">
                                    <select
                                        value={categoryForm.discountType}
                                        onChange={(e) => setCategoryForm((p) => ({ ...p, discountType: e.target.value as DiscountType }))}
                                        className={selectCls}
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="flat">Flat Amount</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelCls}>Value</label>
                                <input
                                    value={categoryForm.value}
                                    onChange={(e) => setCategoryForm((p) => ({ ...p, value: e.target.value }))}
                                    placeholder={categoryForm.discountType === "percentage" ? "e.g. 10" : "e.g. 250"}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Status</label>
                                <div className="relative">
                                    <select
                                        value={categoryForm.status}
                                        onChange={(e) => setCategoryForm((p) => ({ ...p, status: e.target.value as RuleStatus }))}
                                        className={selectCls}
                                    >
                                        <option value="active">Active</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <label className="flex items-center gap-2 text-sm text-text-primary h-10">
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.appliesToAllBrands}
                                        onChange={(e) => setCategoryForm((p) => ({ ...p, appliesToAllBrands: e.target.checked }))}
                                        className="rounded border-border text-primary focus:ring-primary"
                                    />
                                    All brands in category
                                </label>
                            </div>
                        </div>

                        {categoryRuleError && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700 flex items-center gap-2">
                                <X size={13} className="shrink-0" />
                                {categoryRuleError}
                            </div>
                        )}

                        {categoryRuleSuccess && (
                            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-medium text-green-700 flex items-center gap-2">
                                <CheckCircle2 size={13} className="shrink-0" />
                                {categoryRuleSuccess}
                            </div>
                        )}

                        <button
                            onClick={addCategoryRule}
                            disabled={categoryRuleLoading || !categoryForm.category || !categoryForm.value}
                            className="w-full h-10 rounded-xl bg-primary hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {categoryRuleLoading ? (
                                <><Loader2 size={15} className="animate-spin" /> Applying...</>
                            ) : (
                                <><Plus size={16} /> Add Category Rule</>
                            )}
                        </button>
                    </div>
                </SectionCard>

                {/* Brand rule */}
                <SectionCard
                    title="Brand Discount"
                    subtitle="Run offers brand-wise for collections or campaigns"
                    icon={Building2}
                >
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className={labelCls}>Brand</label>
                            <div className="relative">
                                <select
                                    value={brandForm.brand}
                                    onChange={(e) => setBrandForm((p) => ({ ...p, brand: e.target.value }))}
                                    className={selectCls}
                                >
                                    <option value="">Select brand</option>
                                    {brands.map((b) => <option key={b}>{b}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Discount Type</label>
                                <div className="relative">
                                    <select
                                        value={brandForm.discountType}
                                        onChange={(e) => setBrandForm((p) => ({ ...p, discountType: e.target.value as DiscountType }))}
                                        className={selectCls}
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="flat">Flat Amount</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelCls}>Value</label>
                                <input
                                    value={brandForm.value}
                                    onChange={(e) => setBrandForm((p) => ({ ...p, value: e.target.value }))}
                                    placeholder={brandForm.discountType === "percentage" ? "e.g. 8" : "e.g. 200"}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className={labelCls}>Status</label>
                            <div className="relative">
                                <select
                                    value={brandForm.status}
                                    onChange={(e) => setBrandForm((p) => ({ ...p, status: e.target.value as RuleStatus }))}
                                    className={selectCls}
                                >
                                    <option value="active">Active</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                            </div>
                        </div>

                        {brandRuleError && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700 flex items-center gap-2">
                                <X size={13} className="shrink-0" />
                                {brandRuleError}
                            </div>
                        )}

                        {brandRuleSuccess && (
                            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-medium text-green-700 flex items-center gap-2">
                                <CheckCircle2 size={13} className="shrink-0" />
                                {brandRuleSuccess}
                            </div>
                        )}

                        <button
                            onClick={addBrandRule}
                            disabled={brandRuleLoading || !brandForm.brand || !brandForm.value}
                            className="w-full h-10 rounded-xl bg-primary hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {brandRuleLoading ? (
                                <><Loader2 size={15} className="animate-spin" /> Applying...</>
                            ) : (
                                <><Plus size={16} /> Add Brand Rule</>
                            )}
                        </button>
                    </div>
                </SectionCard>

                {/* Bulk setup */}
                <SectionCard
                    title="Bulk Product Discount"
                    subtitle="Pick multiple products and apply a discount rule together"
                    icon={Boxes}
                    action={
                        <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Selected</p>
                            <p className="text-sm font-bold text-text-primary">{selectedProducts.length} products</p>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className={labelCls}>Rule Title</label>
                            <input
                                value={bulkForm.title}
                                onChange={(e) => setBulkForm((p) => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Summer Sale Bundle"
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Type</label>
                                <div className="relative">
                                    <select
                                        value={bulkForm.discountType}
                                        onChange={(e) => setBulkForm((p) => ({ ...p, discountType: e.target.value as DiscountType }))}
                                        className={selectCls}
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="flat">Flat Amount</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelCls}>Value</label>
                                <input
                                    value={bulkForm.value}
                                    onChange={(e) => setBulkForm((p) => ({ ...p, value: e.target.value }))}
                                    className={inputCls}
                                    placeholder="10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelCls}>Min Qty</label>
                                <input
                                    value={bulkForm.minQty}
                                    onChange={(e) => setBulkForm((p) => ({ ...p, minQty: e.target.value }))}
                                    className={inputCls}
                                    placeholder="2"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className={labelCls}>Status</label>
                            <div className="relative">
                                <select
                                    value={bulkForm.status}
                                    onChange={(e) => setBulkForm((p) => ({ ...p, status: e.target.value as RuleStatus }))}
                                    className={selectCls}
                                >
                                    <option value="active">Active</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                            </div>
                        </div>

                        <button
                            onClick={addBulkRule}
                            className="w-full h-10 rounded-xl bg-primary hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <BadgePercent size={16} />
                            Create Bulk Discount
                        </button>
                    </div>
                </SectionCard>
            </div>

            {/* Product selector */}
            <SectionCard
                title="Bulk Product Selection"
                subtitle="Search, filter, and select products to attach to a bulk discount rule"
                icon={Search}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={selectFilteredProducts}
                            className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-text-primary hover:bg-surface transition-colors"
                        >
                            Select Filtered
                        </button>
                        <button
                            onClick={clearSelectedProducts}
                            className="h-9 px-3 rounded-lg border border-coral bg-coral-light text-xs font-semibold text-primary hover:bg-red-100 transition-colors"
                        >
                            Clear Selection
                        </button>
                    </div>
                }
            >
                <div className="glass-panel p-4 !shadow-none !border border-border mb-4">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search name, SKU, brand or category…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={inputCls.replace("bg-background", "bg-surface") + " pl-8 h-9"}
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-surface pl-8 pr-8 text-sm text-text-primary outline-none focus:border-primary appearance-none cursor-pointer"
                            >
                                <option>All</option>
                                {categories.map((c) => <option key={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                        </div>

                        <div className="relative">
                            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                            <select
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-surface pl-8 pr-8 text-sm text-text-primary outline-none focus:border-primary appearance-none cursor-pointer"
                            >
                                <option>All</option>
                                {brands.map((b) => <option key={b}>{b}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                        </div>

                        <span className="ml-auto text-xs text-text-secondary self-center">
                            {filteredProducts.length} products
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-background">
                                {["Select", "Product", "Brand", "Category", "Original Price", "Discounted Price", "Stock"].map((label) => (
                                    <th
                                        key={label}
                                        className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredProducts.map((p) => {
                                const checked = selectedProducts.includes(p.id);

                                return (
                                    <tr key={p.id} className="border-b border-slate-50 hover:bg-background transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleProduct(p.id)}
                                                className="rounded border-border text-primary focus:ring-primary"
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-coral-light flex items-center justify-center shrink-0">
                                                    <Package className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-text-primary whitespace-nowrap">{p.name}</p>
                                                    <p className="text-xs font-mono text-text-secondary">{p.sku}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-text-primary">{p.brand}</td>
                                        <td className="px-4 py-3 text-text-primary">{p.category}</td>
                                        <td className="px-4 py-3 font-bold text-text-primary tabular-nums">
                                            {p.discounted_price != null ? (
                                                <span className="line-through text-text-secondary font-normal text-xs mr-1">{money(p.price)}</span>
                                            ) : null}
                                            {money(p.discounted_price != null ? p.discounted_price : p.price)}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {p.discounted_price != null ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-green-600">{money(p.discounted_price)}</span>
                                                    {p.bulk_offer && (
                                                        <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                                                            {p.bulk_offer}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-text-secondary text-xs">No discount</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">{p.stock}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                            <Package size={36} className="text-slate-200" />
                            <p className="text-sm font-semibold text-text-secondary">No products found</p>
                            <p className="text-xs text-text-secondary">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* Existing rules */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <SectionCard
                    title="Category Rules"
                    subtitle="Current category-level discounts"
                    icon={Layers3}
                >
                    <div className="space-y-3">
                        {categoryRules.map((rule) => (
                            <div key={rule.id} className="rounded-xl border border-border bg-background px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{rule.category}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            {rule.appliesToAllBrands ? "All brands in category" : "Selected brands only"}
                                        </p>
                                    </div>
                                    <StatusPill status={rule.status} />
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="text-sm">
                                        <span className="text-text-secondary">Discount:</span>{" "}
                                        <DiscountValue type={rule.discountType} value={rule.value} />
                                    </div>
                                    <button
                                        onClick={() => {
                                            console.log(`[API DELETE /discounts/${rule.id}] Deleting category rule...`);
                                            api.delete(`/discounts/${rule.id}`)
                                                .then((res) => {
                                                    console.log(`[API DELETE /discounts/${rule.id} Success] Response:`, res.data);
                                                    setCategoryRules((prev) => prev.filter((x) => x.id !== rule.id));
                                                    fetchProducts();
                                                })
                                                .catch((err) => {
                                                    console.error(`[API DELETE /discounts/${rule.id} Error]:`, err);
                                                });
                                        }}
                                        className="w-8 h-8 rounded-lg bg-coral-light hover:bg-red-100 text-coral flex items-center justify-center transition-colors"
                                        title="Delete rule"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {categoryRules.length === 0 && (
                            <div className="text-center py-10">
                                <Layers3 size={28} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-sm font-semibold text-text-secondary">No category rules yet</p>
                            </div>
                        )}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Brand Rules"
                    subtitle="Current brand-specific offers"
                    icon={Building2}
                >
                    <div className="space-y-3">
                        {brandRules.map((rule) => (
                            <div key={rule.id} className="rounded-xl border border-border bg-background px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{rule.brand}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">Brand-wide promotional rule</p>
                                    </div>
                                    <StatusPill status={rule.status} />
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="text-sm">
                                        <span className="text-text-secondary">Discount:</span>{" "}
                                        <DiscountValue type={rule.discountType} value={rule.value} />
                                    </div>
                                    <button
                                        onClick={() => {
                                            api.delete(`/discounts/${rule.id}`)
                                                .then(() => {
                                                    setBrandRules((prev) => prev.filter((x) => x.id !== rule.id));
                                                    fetchProducts();
                                                })
                                                .catch(() => { });
                                        }}
                                        className="w-8 h-8 rounded-lg bg-coral-light hover:bg-red-100 text-coral flex items-center justify-center transition-colors"
                                        title="Delete rule"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {brandRules.length === 0 && (
                            <div className="text-center py-10">
                                <Building2 size={28} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-sm font-semibold text-text-secondary">No brand rules yet</p>
                            </div>
                        )}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Bulk Rules"
                    subtitle="Rules created from selected products"
                    icon={Boxes}
                >
                    <div className="space-y-3">
                        {bulkRules.map((rule) => (
                            <div key={rule.id} className="rounded-xl border border-border bg-background px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{rule.title}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            {rule.selectedProductIds.length} products · Min qty {rule.minQty}
                                        </p>
                                    </div>
                                    <StatusPill status={rule.status} />
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="text-sm">
                                        <span className="text-text-secondary">Discount:</span>{" "}
                                        <DiscountValue type={rule.discountType} value={rule.value} />
                                    </div>
                                    <button
                                        onClick={() => setBulkRules((prev) => prev.filter((x) => x.id !== rule.id))}
                                        className="w-8 h-8 rounded-lg bg-coral-light hover:bg-red-100 text-coral flex items-center justify-center transition-colors"
                                        title="Delete rule"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {bulkRules.length === 0 && (
                            <div className="text-center py-10">
                                <Boxes size={28} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-sm font-semibold text-text-secondary">No bulk rules yet</p>
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* Footer note */}
            <div className="glass-panel p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                    <Percent className="w-4 h-4 text-warning" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-text-primary">Discount logic suggestion</p>
                    <p className="text-xs text-text-secondary mt-1">
                        In production, define priority between bulk, brand, and category rules so overlapping discounts resolve consistently.
                    </p>
                </div>
            </div>
        </div>
    );
}