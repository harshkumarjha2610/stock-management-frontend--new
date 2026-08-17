"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  X,
  ShoppingCart,
  User,
  Phone,
  IndianRupee,
  Receipt,
  Tag,
  Package,
  ScanLine,
  RotateCcw,
  Loader2,
  QrCode,
  CreditCard,
  Building2,
  FileText,
  Monitor,
  Store,
  CalendarCheck,
  ClipboardCheck,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  sellingPrice: number;
  discountedPrice?: number | null;
  discountPercent?: number | null;
  gstPercent: number;
  stock: number;
  barcode: string;
  size?: string;
  productId?: string;
};

type CartItem = Product & {
  qty: number;
  discount: number;
};

type PaymentMethod = "cash" | "upi" | "card";

type StorePayment = {
  name: string;
  upiId: string;
  upiPayeeName: string;
};

type CardType =
  | "Visa"
  | "Mastercard"
  | "RuPay"
  | "American Express"
  | "Maestro"
  | "Diners Club"
  | "Other";

type PaymentMode = "Tap (Contactless)" | "Chip (Insert)" | "Swipe";
type CardStatus = "Pending" | "Successful" | "Failed";

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: "cash", label: "Cash", icon: "💵" },
  { key: "upi", label: "UPI", icon: "📱" },
  { key: "card", label: "Card", icon: "💳" },
];

const CARD_TYPES: CardType[] = [
  "Visa",
  "Mastercard",
  "RuPay",
  "American Express",
  "Maestro",
  "Diners Club",
  "Other",
];

const PAYMENT_MODES: PaymentMode[] = [
  "Tap (Contactless)",
  "Chip (Insert)",
  "Swipe",
];

const BANK_NAMES = [
  "SBI",
  "HDFC",
  "ICICI",
  "Axis",
  "Kotak Mahindra",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank",
  "Other",
];

const inputCls =
  "h-9 w-full rounded-sm border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-red-400 focus:ring-2 focus:ring-primary transition-colors";

const selectCls = inputCls + " appearance-none pr-8 cursor-pointer";

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function buildUpiLink(
  upiId: string,
  payeeName: string,
  amount: number,
  note: string
) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName || "Store",
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

function useFadeInUpKeyframes() {
  useEffect(() => {
    const id = "billing-fade-in-up-keyframes";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    };
  }, []);
}

function printInvoice(
  cart: CartItem[],
  customer: { name: string; phone: string },
  payment: PaymentMethod,
  invoiceNo: string,
  totals: {
    subtotal: number;
    totalDiscount: number;
    taxableAmount: number;
    totalGST: number;
    grandTotal: number;
    cashReceived: number;
  },
  cardDetails?: {
    cardType: string;
    paymentMode: string;
    bankName: string;
    last4Digits: string;
    rrn: string;
    approvalCode?: string;
    terminalId?: string;
    merchantId?: string;
    status: string;
    notes?: string;
  }
) {
  const rows = cart
    .map((item) => {
      const base = item.sellingPrice * item.qty;
      const disc = item.discount * item.qty;
      const taxable = base - disc;
      const gst = Math.round((taxable * item.gstPercent) / 100);
      const total = taxable + gst;

      return `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">₹${item.sellingPrice.toLocaleString(
        "en-IN"
      )}</td>
        <td style="text-align:center">${item.gstPercent}%</td>
        <td style="text-align:right">${item.discount > 0
          ? "₹" + (item.discount * item.qty).toLocaleString("en-IN")
          : "—"
        }</td>
        <td style="text-align:right">₹${total.toLocaleString("en-IN")}</td>
      </tr>`;
    })
    .join("");

  let cardInfoHtml = "";
  if (payment === "card" && cardDetails) {
    cardInfoHtml = `
      <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:4px; padding:12px 16px; margin-bottom:16px;">
        <p style="font-size:11px; color:#7c3aed; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">💳 Card Payment Details</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; font-size:12px;">
          <div><span style="color:#64748b">Card Type:</span> <strong style="color:#1e293b">${cardDetails.cardType}</strong></div>
          <div><span style="color:#64748b">Payment Mode:</span> <strong style="color:#1e293b">${cardDetails.paymentMode}</strong></div>
          <div><span style="color:#64748b">Bank:</span> <strong style="color:#1e293b">${cardDetails.bankName}</strong></div>
          <div><span style="color:#64748b">Last 4 Digits:</span> <strong style="color:#1e293b">**** ${cardDetails.last4Digits}</strong></div>
          <div><span style="color:#64748b">RRN:</span> <strong style="color:#1e293b">${cardDetails.rrn}</strong></div>
          ${cardDetails.approvalCode
        ? `<div><span style="color:#64748b">Approval Code:</span> <strong style="color:#1e293b">${cardDetails.approvalCode}</strong></div>`
        : ""
      }
          ${cardDetails.terminalId
        ? `<div><span style="color:#64748b">Terminal ID:</span> <strong style="color:#1e293b">${cardDetails.terminalId}</strong></div>`
        : ""
      }
          ${cardDetails.merchantId
        ? `<div><span style="color:#64748b">Merchant ID:</span> <strong style="color:#1e293b">${cardDetails.merchantId}</strong></div>`
        : ""
      }
          <div><span style="color:#64748b">Status:</span> <strong style="color:${cardDetails.status === "Successful"
        ? "#16a34a"
        : cardDetails.status === "Failed"
          ? "#dc2626"
          : "#ca8a04"
      }">${cardDetails.status}</strong></div>
        </div>
        ${cardDetails.notes
        ? `<p style="margin-top:8px; font-size:11px; color:#64748b; border-top:1px solid #e9d5ff; padding-top:6px;">📝 ${cardDetails.notes}</p>`
        : ""
      }
      </div>`;
  }

  const html = `
    <html>
    <head>
      <title>Invoice ${invoiceNo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
        body { padding: 32px; font-size: 13px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .shop { font-size: 20px; font-weight: 700; color: #dc2626; }
        .inv { text-align: right; }
        .inv p { font-size: 12px; color: #64748b; }
        .inv strong { font-size: 15px; color: #1e293b; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
        .customer { display: flex; gap: 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; }
        .customer p { font-size: 12px; color: #64748b; }
        .customer strong { font-size: 13px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
        .totals { margin-left: auto; width: 280px; }
        .totals tr td { padding: 4px 0; font-size: 13px; }
        .totals tr td:last-child { text-align: right; font-weight: 600; }
        .grand td { font-size: 15px; font-weight: 700; color: #dc2626; border-top: 2px solid #e2e8f0; padding-top: 8px; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="shop">🏪 ShopAdmin</div>
          <p style="font-size:12px;color:#64748b;margin-top:4px">GST No: 27AABCS1429B1Z1</p>
          <p style="font-size:12px;color:#64748b">Phone: +91 98765 43210</p>
        </div>
        <div class="inv">
          <strong>Invoice #${invoiceNo}</strong>
          <p>Date: ${new Date().toLocaleDateString("en-IN")}</p>
          <p>Time: ${new Date().toLocaleTimeString("en-IN")}</p>
          <p>Payment: ${payment.toUpperCase()}</p>
        </div>
      </div>

      <hr class="divider"/>

      <div class="customer">
        <div><p>Customer Name</p><strong>${customer.name || "Walk-in Customer"}</strong></div>
        <div><p>Phone</p><strong>${customer.phone || "—"}</strong></div>
      </div>

      ${cardInfoHtml}

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Rate</th>
            <th style="text-align:center">GST</th>
            <th style="text-align:right">Discount</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table class="totals">
        <tr><td>Subtotal</td><td>₹${totals.subtotal.toLocaleString("en-IN")}</td></tr>
        ${totals.totalDiscount > 0
      ? `<tr><td style="color:#16a34a">Discount</td><td style="color:#16a34a">−₹${totals.totalDiscount.toLocaleString(
        "en-IN"
      )}</td></tr>`
      : ""
    }
        <tr><td>Taxable Amount</td><td>₹${totals.taxableAmount.toLocaleString("en-IN")}</td></tr>
        <tr><td>GST</td><td>₹${totals.totalGST.toLocaleString("en-IN")}</td></tr>
        ${payment === "cash"
      ? `<tr><td>Cash Received</td><td>₹${totals.cashReceived.toLocaleString(
        "en-IN"
      )}</td></tr>
               <tr><td>Change</td><td>₹${(
        totals.cashReceived - totals.grandTotal
      ).toLocaleString("en-IN")}</td></tr>`
      : ""
    }
        <tr class="grand"><td>Grand Total</td><td>₹${totals.grandTotal.toLocaleString(
      "en-IN"
    )}</td></tr>
      </table>

      <div class="footer">
        <p>Thank you for your purchase! 🙏</p>
        <p style="margin-top:4px">Powered by ShopAdmin</p>
      </div>
    </body>
    </html>`;

  const w = window.open("", "_blank", "width=700,height=900");
  if (!w) return;

  w.document.write(html);
  w.document.close();
  w.focus();

  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
}

export default function BillingPage() {
  useFadeInUpKeyframes();

  const [products, setProducts] = useState<Product[]>([]);
  const [storePayment, setStorePayment] = useState<StorePayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);

        const activeStoreId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeStoreId")
            : null;

        const [res, storeRes] = await Promise.all([
          apiFetch("/products"),
          activeStoreId ? apiFetch(`/stores/${activeStoreId}`) : Promise.resolve(null),
        ]);

        // DEBUG: show full raw response
        console.log("[Billing] RAW res:", JSON.stringify(res)?.slice(0, 500));
        console.log("[Billing] res is Array?", Array.isArray(res));
        console.log("[Billing] res keys:", res && typeof res === "object" ? Object.keys(res) : typeof res);

        // Unwrap all known API response shapes
        let productList: any[] = [];
        if (Array.isArray(res)) {
          productList = res;
        } else if (Array.isArray(res?.data)) {
          productList = res.data;
        } else if (Array.isArray((res as any)?.products)) {
          productList = (res as any).products;
        } else if (Array.isArray((res as any)?.items)) {
          productList = (res as any).items;
        } else if (Array.isArray((res as any)?.result)) {
          productList = (res as any).result;
        }

        console.log("[Billing] productList length:", productList.length);
        if (productList.length > 0) {
          console.log("[Billing] first product (raw):", JSON.stringify(productList[0]));
        }

        const mapped: Product[] = [];

        for (const p of productList) {
          const base = {
            id: String(p.id ?? ""),
            name: String(p.name ?? p.product_name ?? ""),
            category: String(p.category ?? ""),
            brand: String(p.brand ?? ""),
            sellingPrice: parseFloat(p.selling_price ?? p.sellingprice ?? p.selling_Price ?? 0) || 0,
            discountedPrice: p.discounted_price != null ? parseFloat(p.discounted_price) : null,
            discountPercent: p.discount_percent != null ? parseFloat(p.discount_percent) : null,
            gstPercent: parseFloat(p.gst_percent ?? p.gstpercent ?? p.gst ?? 0) || 0,
          };

          // Guard: p.sizes must be a real array
          const sizes = Array.isArray(p.sizes) ? p.sizes : [];
          if (sizes.length > 0) {
            for (const s of sizes) {
              mapped.push({
                ...base,
                id: `${base.id}-${String(s?.size ?? "")}`,
                productId: base.id,
                name: `${base.name} (${String(s?.size ?? "")})`,
                size: String(s?.size ?? ""),
                stock: Number(s?.quantity ?? s?.stock ?? 0),
                barcode: String(s?.barcode ?? p?.barcode ?? p?.sku ?? ""),
              });
            }
          } else {
            mapped.push({
              ...base,
              productId: base.id,
              stock: Number(p.stock_quantity ?? p.stockquantity ?? p.stock ?? 0),
              barcode: String(p.barcode ?? p.sku ?? ""),
            });
          }
        }

        console.log("[Billing] mapped products count:", mapped.length);
        if (mapped.length > 0) console.log("[Billing] first mapped product:", mapped[0]);

        setProducts(mapped);

        // Unwrap store response
        const store = storeRes?.data ?? storeRes;
        if (store && typeof store === "object") {
          setStorePayment({
            name: String(store.name ?? ""),
            upiId: String(store.upi_id ?? store.upiid ?? store.upi ?? ""),
            upiPayeeName: String(
              store.upi_payee_name ?? store.upipayeename ?? store.name ?? ""
            ),
          });
        }
      } catch (error) {
        console.error("[Billing] Failed to fetch billing data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [showUpiPopup, setShowUpiPopup] = useState(false);

  const [cardType, setCardType] = useState<CardType>("Visa");
  const [cardPaymentMode, setCardPaymentMode] =
    useState<PaymentMode>("Tap (Contactless)");
  const [cardBankName, setCardBankName] = useState<string>("SBI");
  const [cardLast4, setCardLast4] = useState("");
  const [cardRRN, setCardRRN] = useState("");
  const [cardApprovalCode, setCardApprovalCode] = useState("");
  const [cardTerminalId, setCardTerminalId] = useState("");
  const [cardMerchantId, setCardMerchantId] = useState("");
  const [cardStatus, setCardStatus] = useState<CardStatus>("Pending");
  const [cardNotes, setCardNotes] = useState("");
  const [cardDateTime, setCardDateTime] = useState("");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  const [mode, setMode] = useState<"sale" | "return">("sale");
  const [success, setSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (payMethod === "card") {
      const now = new Date();
      const formatted = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setCardDateTime(formatted);
    }
  }, [payMethod]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    console.log("[Billing] search q:", q, "| products count:", products.length);
    if (products.length > 0) console.log("[Billing] first product name:", products[0].name);

    return products
      .filter((p) => {
        const name = (p.name ?? "").toLowerCase();
        const barcode = (p.barcode ?? "").toLowerCase();
        const id = String(p.id ?? "").toLowerCase();
        const productId = String(p.productId ?? "").toLowerCase();
        const brand = (p.brand ?? "").toLowerCase();
        const category = (p.category ?? "").toLowerCase();
        const size = (p.size ?? "").toLowerCase();

        return (
          name.includes(q) ||
          barcode.includes(q) ||
          id.includes(q) ||
          productId.includes(q) ||
          brand.includes(q) ||
          category.includes(q) ||
          size.includes(q)
        );
      })
      .slice(0, 6);
  }, [search, products]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === product.id);

      if (exists) {
        return prev.map((c) =>
          c.id === product.id && c.qty < c.stock
            ? { ...c, qty: c.qty + 1 }
            : c
        );
      }

      const defaultDiscount =
        product.discountedPrice != null && product.discountedPrice < product.sellingPrice
          ? Math.max(0, product.sellingPrice - product.discountedPrice)
          : 0;

      return [...prev, { ...product, qty: 1, discount: defaultDiscount }];
    });

    setSearch("");
    setShowSearch(false);
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id
            ? { ...c, qty: Math.max(0, Math.min(c.stock, c.qty + delta)) }
            : c
        )
        .filter((c) => c.qty > 0)
    );
  }

  function setDiscount(id: string, val: number) {
    setCart((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, discount: Math.max(0, Math.min(val, c.sellingPrice)) }
          : c
      )
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  function clearCart() {
    setCart([]);
    setCustName("");
    setCustPhone("");
    setCashReceived(0);
    setBillDiscount(0);
    setPayMethod("cash");
    setShowUpiPopup(false);
    setSuccess(false);
    setMode("sale");
    setCardType("Visa");
    setCardPaymentMode("Tap (Contactless)");
    setCardBankName("SBI");
    setCardLast4("");
    setCardRRN("");
    setCardApprovalCode("");
    setCardTerminalId("");
    setCardMerchantId("");
    setCardStatus("Pending");
    setCardNotes("");
    setCardDateTime("");
    setCardErrors({});
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((t, c) => t + c.sellingPrice * c.qty, 0);
    const itemDiscount = cart.reduce((t, c) => t + c.discount * c.qty, 0);
    const afterItemDisc = subtotal - itemDiscount;
    const billDisc = Math.round((afterItemDisc * billDiscount) / 100);
    const totalDiscount = itemDiscount + billDisc;
    const taxableAmount = subtotal - totalDiscount;

    const totalGST = cart.reduce((t, c) => {
      const base = (c.sellingPrice - c.discount) * c.qty;
      return t + Math.round((base * c.gstPercent) / 100);
    }, 0);

    const grandTotal = taxableAmount + totalGST;
    const change =
      payMethod === "cash" ? Math.max(0, cashReceived - grandTotal) : 0;

    return {
      subtotal,
      itemDiscount,
      billDisc,
      totalDiscount,
      taxableAmount,
      totalGST,
      grandTotal,
      change,
    };
  }, [cart, billDiscount, cashReceived, payMethod]);

  function validateCardPayment(): boolean {
    const errors: Record<string, string> = {};

    if (!cardLast4 || cardLast4.length !== 4 || !/^\d{4}$/.test(cardLast4)) {
      errors.last4 = "Enter valid 4 digits";
    }

    if (!cardRRN.trim()) {
      errors.rrn = "Transaction RRN is required";
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitBill(paidStatus: "PAID" | "UNPAID" = "PAID") {
    if (cart.length === 0) return;
    if (payMethod === "card" && !validateCardPayment()) return;

    setSubmitting(true);

    try {
      const payload: any = {
        customer_name: custName,
        customer_phone: custPhone,
        payment_method: payMethod,
        paid_status: paidStatus,
        discount_percent: billDiscount,
        cash_received: cashReceived,
        items: cart.map((item) => ({
          product_id: item.productId ?? item.id,
          quantity: item.qty,
          price: item.sellingPrice,
          discount: item.discount,
          gst_percent: item.gstPercent,
          ...(item.size ? { size: item.size } : {}),
        })),
        type: mode.toUpperCase(),
      };

      if (payMethod === "card") {
        payload.card_details = {
          card_type: cardType,
          payment_mode: cardPaymentMode,
          bank_name: cardBankName,
          last_4_digits: cardLast4,
          rrn: cardRRN,
          approval_code: cardApprovalCode || undefined,
          terminal_id: cardTerminalId || undefined,
          merchant_id: cardMerchantId || undefined,
          status: cardStatus,
          notes: cardNotes || undefined,
          transaction_time: cardDateTime,
        };
      }

      const res = await apiFetch("/bills", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const invNo = res.invoice_no || res.invoice_number || "";
      setLastInvoice(invNo);

      const cardDetails =
        payMethod === "card"
          ? {
            cardType,
            paymentMode: cardPaymentMode,
            bankName: cardBankName,
            last4Digits: cardLast4,
            rrn: cardRRN,
            approvalCode: cardApprovalCode,
            terminalId: cardTerminalId,
            merchantId: cardMerchantId,
            status: cardStatus,
            notes: cardNotes,
          }
          : undefined;

      printInvoice(
        cart,
        { name: custName, phone: custPhone },
        payMethod,
        invNo,
        {
          subtotal: totals.subtotal,
          totalDiscount: totals.totalDiscount,
          taxableAmount: totals.taxableAmount,
          totalGST: totals.totalGST,
          grandTotal: totals.grandTotal,
          cashReceived,
        },
        cardDetails
      );

      setSuccess(true);
      setShowUpiPopup(false);
    } catch (error: any) {
      alert(error?.message || "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) return;

    if (payMethod === "upi" && mode === "sale") {
      if (!storePayment?.upiId) {
        alert("Add the store UPI ID before accepting UPI payments.");
        return;
      }

      setShowUpiPopup(true);
      return;
    }

    await submitBill("PAID");
  }

  const upiLink = storePayment?.upiId
    ? buildUpiLink(
      storePayment.upiId,
      storePayment.upiPayeeName || storePayment.name,
      totals.grandTotal,
      `Bill payment ${storePayment.name || ""}`.trim()
    )
    : "";

  const upiQrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      upiLink
    )}`
    : "";

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <Loader2 size={18} className="animate-spin" />
          Loading billing data...
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary">
            {mode === "sale" ? "Bill Generated!" : "Return Processed!"}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {mode === "sale" ? "Invoice" : "Return Ref"}{" "}
            <span
              className={`font-mono font-semibold ${mode === "sale" ? "text-primary" : "text-warning"
                }`}
            >
              {lastInvoice}
            </span>{" "}
            {mode === "sale"
              ? "printed successfully."
              : "recorded successfully."}
          </p>
          <p className="mt-3 text-2xl font-bold text-text-primary">
            {fmt(totals.grandTotal)}
          </p>
          {payMethod === "cash" && totals.change > 0 && (
            <p className="mt-1 text-sm font-semibold text-success">
              Change to return: {fmt(totals.change)}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className={`flex h-10 items-center gap-2 rounded-md px-6 text-sm font-semibold text-white shadow-sm transition-colors ${mode === "sale"
              ? "bg-primary hover:bg-red-700"
              : "bg-amber-600 hover:bg-amber-700"
              }`}
          >
            <RotateCcw size={16} /> New {mode === "sale" ? "Bill" : "Transaction"}
          </button>

          <button
            onClick={() =>
              printInvoice(cart, { name: custName, phone: custPhone }, payMethod, lastInvoice, {
                subtotal: totals.subtotal,
                totalDiscount: totals.totalDiscount,
                taxableAmount: totals.taxableAmount,
                totalGST: totals.totalGST,
                grandTotal: totals.grandTotal,
                cashReceived,
              })
            }
            className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-6 text-sm font-semibold text-text-primary transition-colors hover:bg-background"
          >
            <Printer size={16} /> Reprint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] gap-5">
      {showUpiPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700">
                  <QrCode size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">UPI Payment</h2>
                  <p className="text-xs text-text-secondary">{fmt(totals.grandTotal)}</p>
                </div>
              </div>

              <button
                onClick={() => setShowUpiPopup(false)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-text-secondary hover:bg-background"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 text-center">
              <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-md border border-border bg-white p-3">
                {upiQrUrl ? (
                  <img
                    src={upiQrUrl}
                    alt="UPI payment QR code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-text-secondary">UPI details unavailable</p>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-text-primary">
                  {storePayment?.upiPayeeName || storePayment?.name}
                </p>
                <p className="text-xs font-mono text-text-secondary">
                  {storePayment?.upiId}
                </p>
              </div>

              <a
                href={upiLink}
                className="inline-flex h-9 items-center justify-center rounded-sm border border-border bg-background px-4 text-xs font-semibold text-text-primary hover:bg-red-50"
              >
                Open UPI App
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowUpiPopup(false)}
                className="h-10 rounded-md border border-coral bg-coral-light text-sm font-bold text-primary hover:bg-red-100 disabled:opacity-50"
              >
                Payment Rejected
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => submitBill("PAID")}
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-success text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Completed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Billing</h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              {mode === "sale"
                ? "Create new invoice / POS bill"
                : "Process product return / refund"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-sm bg-background p-1">
              <button
                onClick={() => setMode("sale")}
                className={`rounded-sm px-3 py-1.5 text-xs font-bold transition-all ${mode === "sale"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
                  }`}
              >
                Sale
              </button>
              <button
                onClick={() => setMode("return")}
                className={`rounded-sm px-3 py-1.5 text-xs font-bold transition-all ${mode === "return"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
                  }`}
              >
                Return
              </button>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="flex h-8 items-center gap-1.5 rounded-sm border border-coral bg-coral-light px-3 text-xs font-semibold text-primary transition-colors hover:bg-red-100"
              >
                <RotateCcw size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="relative z-40">
          <div
            className={`flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 transition-all ${mode === "sale"
              ? "focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/20"
              : "focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20"
              }`}
          >
            <Search className="h-4 w-4 shrink-0 text-text-secondary" />
            <input
              type="text"
              placeholder="Search product by name, barcode, brand or ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />

            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setShowSearch(false);
                }}
              >
                <X size={14} className="text-text-secondary hover:text-text-primary" />
              </button>
            )}

            <button
              className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${mode === "sale"
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
            >
              <ScanLine size={14} /> Scan
            </button>
          </div>

          {showSearch && searchResults.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-50 mt-1.5 isolate overflow-hidden rounded-md border border-border bg-white shadow-2xl ring-1 ring-black/5 backdrop-blur-0"
              style={{ backgroundColor: "#ffffff" }}
            >
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex w-full items-center gap-3 border-b border-slate-50 bg-white px-4 py-3 text-left transition-colors duration-150 last:border-0 hover:bg-yellow-50 focus:bg-yellow-50 focus:outline-none"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-bold ${p.size
                      ? "bg-blue-100 text-blue-700"
                      : "bg-background text-text-secondary"
                      }`}
                  >
                    {p.size ? p.size : <Package size={14} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {p.name}
                      </p>
                      {p.size && (
                        <span className="shrink-0 rounded-sm border border-blue-100 bg-blue-50 px-1.5 py-px text-xs font-semibold text-blue-600">
                          Size: {p.size}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">
                      {p.brand} · {p.category} · Stock: {p.stock}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {p.discountedPrice != null && p.discountedPrice < p.sellingPrice ? (
                      <div>
                        <p className="text-sm font-bold text-success">{fmt(p.discountedPrice)}</p>
                        <p className="text-[10px] line-through text-text-secondary">{fmt(p.sellingPrice)}</p>
                      </div>
                    ) : (
                      <p
                        className={`text-sm font-bold ${mode === "sale" ? "text-red-700" : "text-amber-700"
                          }`}
                      >
                        {fmt(p.sellingPrice)}
                      </p>
                    )}
                    <p className="text-xs text-text-secondary">+{p.gstPercent}% GST</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSearch && search.trim() && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-md border border-border bg-white px-4 py-3 text-sm text-text-secondary shadow-2xl ring-1 ring-black/5">
              No matching product found.
            </div>
          )}

          {showSearch && (
            <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
          )}
        </div>

        <div className="glass-panel flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border bg-background px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-text-secondary" />
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                  Cart — {cart.length} item{cart.length !== 1 ? "s" : ""}
                </p>
              </div>

              {cart.length > 0 && (
                <p className="text-xs text-text-secondary">
                  {cart.reduce((t, c) => t + c.qty, 0)} units total
                </p>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                <ShoppingCart size={36} className="text-slate-200" />
                <p className="text-sm font-semibold text-text-secondary">Cart is empty</p>
                <p className="text-xs text-slate-300">Search and add products above</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                <div className="grid grid-cols-[1fr_100px_80px_120px_100px] gap-2 bg-background/50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <span>Product</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Rate</span>
                  <span className="text-center">Discount/unit</span>
                  <span className="text-right">Amount</span>
                </div>

                {cart.map((item) => {
                  const lineBase = item.sellingPrice * item.qty;
                  const lineDisc = item.discount * item.qty;
                  const lineTaxable = lineBase - lineDisc;
                  const lineGST = Math.round((lineTaxable * item.gstPercent) / 100);
                  const lineTotal = lineTaxable + lineGST;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_100px_80px_120px_100px] items-center gap-2 px-5 py-3.5 transition-colors hover:bg-background"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {item.name}
                          </p>
                          {item.size && (
                            <span className="shrink-0 rounded-sm border border-blue-100 bg-blue-50 px-1.5 py-px text-xs font-semibold text-blue-600">
                              {item.size}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs text-text-secondary">
                            {item.productId ?? item.id}
                          </span>
                          <span className="rounded-sm bg-background px-1.5 py-px text-xs text-text-secondary">
                            {item.gstPercent}% GST
                          </span>
                          {item.stock <= 5 && (
                            <span className="rounded-sm bg-warning/10 px-1.5 py-px text-xs font-semibold text-warning">
                              Low stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-none border border-border text-text-secondary transition-colors hover:bg-background"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums text-text-primary">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          disabled={item.qty >= item.stock}
                          className="flex h-6 w-6 items-center justify-center rounded-none border border-border text-text-secondary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right">
                        {item.discountedPrice != null && item.discountedPrice < item.sellingPrice ? (
                          <div>
                            <p className="text-sm font-bold text-success tabular-nums">{fmt(item.discountedPrice)}</p>
                            <p className="text-[10px] line-through text-text-secondary tabular-nums">{fmt(item.sellingPrice)}</p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium tabular-nums text-text-primary">
                            {fmt(item.sellingPrice)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-secondary" />
                          <input
                            type="number"
                            min={0}
                            max={item.sellingPrice}
                            value={item.discount || ""}
                            placeholder="0"
                            onChange={(e) => setDiscount(item.id, Number(e.target.value))}
                            className="h-7 w-20 rounded-sm border border-border bg-mint-light pl-5 pr-2 text-center text-xs font-semibold tabular-nums text-success outline-none transition-colors focus:border-green-400 focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-text-primary">
                          {fmt(lineTotal)}
                        </p>
                        {lineGST > 0 && (
                          <p className="text-xs tabular-nums text-text-secondary">
                            incl. {fmt(lineGST)} GST
                          </p>
                        )}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="mt-1 text-coral transition-colors hover:text-primary"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-96 shrink-0 space-y-4 overflow-y-auto">
        <div className="glass-panel rounded-none space-y-3 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Customer
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Name"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className={inputCls + " pl-8"}
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Phone"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className={inputCls + " pl-8"}
              />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-none space-y-3 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Payment Method
          </p>

          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setPayMethod(m.key)}
                className={`flex flex-col items-center gap-1 rounded-md border py-2.5 text-xs font-semibold transition-all duration-300 ${payMethod === m.key
                  ? "border-violet-500 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-300/40 scale-[1.02]"
                  : "border-white/30 bg-white/20 backdrop-blur-md text-text-primary hover:border-violet-300 hover:bg-violet-50/50"
                  }`}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {payMethod === "cash" && (
            <div className="space-y-2" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
                <input
                  type="number"
                  min={0}
                  placeholder="Cash received"
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className={inputCls + " pl-8"}
                />
              </div>

              {cashReceived > 0 && cashReceived >= totals.grandTotal && (
                <div className="flex items-center justify-between rounded-sm border border-green-100 bg-mint-light px-3 py-2">
                  <p className="text-xs font-semibold text-success">Change to return</p>
                  <p className="text-sm font-bold text-success">{fmt(totals.change)}</p>
                </div>
              )}

              {cashReceived > 0 && cashReceived < totals.grandTotal && (
                <div className="flex items-center justify-between rounded-sm border border-coral bg-coral-light px-3 py-2">
                  <p className="text-xs font-semibold text-primary">Short by</p>
                  <p className="text-sm font-bold text-primary">
                    {fmt(totals.grandTotal - cashReceived)}
                  </p>
                </div>
              )}
            </div>
          )}

          {payMethod === "card" && (
            <div className="space-y-3" style={{ animation: "fadeInUp 0.35s ease-out both" }}>
              <div className="flex items-center gap-2 rounded-sm border border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-3 py-2">
                <CreditCard className="h-4 w-4 text-violet-600" />
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  Card Payment Details
                </p>
                <span className="ml-auto rounded-sm bg-white/70 px-1.5 py-0.5 text-[10px] font-mono text-violet-500">
                  POS
                </span>
              </div>

              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  readOnly
                  value={fmt(totals.grandTotal)}
                  className={`${inputCls} pl-8 bg-violet-50/50 border-violet-200 text-violet-800 font-bold cursor-not-allowed`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-violet-500">
                  Amount
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <CreditCard size={10} className="text-violet-500" /> Card Type
                  </label>
                  <div className="relative">
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value as CardType)}
                      className={`${selectCls} text-xs`}
                    >
                      {CARD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-secondary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <ScanLine size={10} className="text-violet-500" /> Payment Mode
                  </label>
                  <div className="relative">
                    <select
                      value={cardPaymentMode}
                      onChange={(e) =>
                        setCardPaymentMode(e.target.value as PaymentMode)
                      }
                      className={`${selectCls} text-xs`}
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-secondary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <Building2 size={10} className="text-violet-500" /> Bank
                  </label>
                  <div className="relative">
                    <select
                      value={cardBankName}
                      onChange={(e) => setCardBankName(e.target.value)}
                      className={`${selectCls} text-xs`}
                    >
                      {BANK_NAMES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-secondary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <CreditCard size={10} className="text-violet-500" /> Last 4 Digits
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="4582"
                      value={cardLast4}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCardLast4(val);
                        if (cardErrors.last4)
                          setCardErrors((prev) => {
                            const n = { ...prev };
                            delete n.last4;
                            return n;
                          });
                      }}
                      className={`${inputCls} text-center text-xs font-mono tracking-widest ${cardErrors.last4 ? "border-red-400 bg-red-50" : ""
                        }`}
                    />
                  </div>
                  {cardErrors.last4 && (
                    <p className="text-[10px] text-red-500">{cardErrors.last4}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                  <FileText size={10} className="text-violet-500" /> Transaction RRN{" "}
                  <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="123456789012"
                    value={cardRRN}
                    onChange={(e) => {
                      setCardRRN(e.target.value);
                      if (cardErrors.rrn)
                        setCardErrors((prev) => {
                          const n = { ...prev };
                          delete n.rrn;
                          return n;
                        });
                    }}
                    className={`${inputCls} text-xs font-mono ${cardErrors.rrn ? "border-red-400 bg-red-50" : ""
                      }`}
                  />
                </div>
                {cardErrors.rrn && (
                  <p className="text-[10px] text-red-500">{cardErrors.rrn}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <ClipboardCheck size={10} className="text-violet-500" /> Approval Code
                  </label>
                  <input
                    type="text"
                    placeholder="458712"
                    value={cardApprovalCode}
                    onChange={(e) => setCardApprovalCode(e.target.value)}
                    className={`${inputCls} text-xs font-mono`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <Monitor size={10} className="text-violet-500" /> Terminal ID
                  </label>
                  <input
                    type="text"
                    placeholder="POS001"
                    value={cardTerminalId}
                    onChange={(e) => setCardTerminalId(e.target.value)}
                    className={`${inputCls} text-xs font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <Store size={10} className="text-violet-500" /> Merchant ID
                  </label>
                  <input
                    type="text"
                    placeholder="MER12345"
                    value={cardMerchantId}
                    onChange={(e) => setCardMerchantId(e.target.value)}
                    className={`${inputCls} text-xs font-mono`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    <CalendarCheck size={10} className="text-violet-500" /> Date & Time
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={cardDateTime}
                    className={`${inputCls} cursor-not-allowed bg-slate-50 text-xs text-text-secondary`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                  <ClipboardCheck size={10} className="text-violet-500" /> Payment Status
                </label>
                <div className="relative">
                  <select
                    value={cardStatus}
                    onChange={(e) => setCardStatus(e.target.value as CardStatus)}
                    className={`${selectCls} text-xs ${cardStatus === "Successful"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : cardStatus === "Failed"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Successful">✅ Successful</option>
                    <option value="Failed">❌ Failed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-secondary" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                  <StickyNote size={10} className="text-violet-500" /> Notes
                </label>
                <textarea
                  placeholder="Additional payment remarks..."
                  value={cardNotes}
                  onChange={(e) => setCardNotes(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-sm border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-none space-y-3 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Bill Discount
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
              <input
                type="number"
                min={0}
                max={100}
                placeholder="0"
                value={billDiscount || ""}
                onChange={(e) => setBillDiscount(Math.min(100, Number(e.target.value)))}
                className={inputCls + " pl-8"}
              />
            </div>
            <span className="text-sm font-bold text-text-secondary">%</span>
          </div>

          {totals.billDisc > 0 && (
            <p className="text-xs font-semibold text-success">
              Saving: {fmt(totals.billDisc)}
            </p>
          )}
        </div>

        <div className="glass-panel rounded-none p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
            Bill Summary
          </p>
          <div className="space-y-2.5">
            {[
              { label: "Subtotal", value: fmt(totals.subtotal), cls: "text-text-primary" },
              ...(totals.itemDiscount > 0
                ? [
                  {
                    label: "Item Discounts",
                    value: `−${fmt(totals.itemDiscount)}`,
                    cls: "text-success",
                  },
                ]
                : []),
              ...(totals.billDisc > 0
                ? [
                  {
                    label: `Bill Discount (${billDiscount}%)`,
                    value: `−${fmt(totals.billDisc)}`,
                    cls: "text-success",
                  },
                ]
                : []),
              {
                label: "Taxable Amount",
                value: fmt(totals.taxableAmount),
                cls: "text-text-primary",
              },
              { label: "Total GST", value: fmt(totals.totalGST), cls: "text-warning" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">{row.label}</p>
                <p className={`text-xs font-semibold tabular-nums ${row.cls}`}>
                  {row.value}
                </p>
              </div>
            ))}

            <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
              <p className="text-sm font-bold text-text-primary">
                {mode === "sale" ? "Grand Total" : "Total Refund"}
              </p>
              <p
                className={`text-xl font-bold tabular-nums ${mode === "sale" ? "text-red-700" : "text-amber-700"
                  }`}
              >
                {fmt(totals.grandTotal)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={
            cart.length === 0 ||
            submitting ||
            (payMethod === "cash" &&
              cashReceived > 0 &&
              cashReceived < totals.grandTotal) ||
            (payMethod === "card" && Object.keys(cardErrors).length > 0)
          }
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-bold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${mode === "sale"
            ? "bg-primary hover:bg-red-700 shadow-red-200"
            : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
            }`}
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : mode === "sale" ? (
            <Receipt size={18} />
          ) : (
            <RotateCcw size={18} />
          )}

          {submitting
            ? "Processing..."
            : payMethod === "upi" && mode === "sale"
              ? "Show UPI QR"
              : payMethod === "card" && mode === "sale"
                ? "Process Card Payment & Print"
                : mode === "sale"
                  ? "Generate Bill & Print"
                  : "Process Return & Print"}
        </button>

        <p className="-mt-1 text-center text-xs text-text-secondary">
          {payMethod === "upi" && mode === "sale"
            ? "Confirm payment after scanning QR"
            : payMethod === "card" && mode === "sale"
              ? "Verify card details before processing"
              : "Bill will open in a print dialog"}
        </p>
      </div>
    </div>
  );
}