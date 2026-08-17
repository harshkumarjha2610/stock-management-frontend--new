"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, Plus, Eye, Pencil, Trash2, X, ChevronDown,
  UserCheck, Clock, BadgeIndianRupee, Phone, CalendarDays,
  CheckCircle, XCircle, LogIn, LogOut, FileText,
  TrendingUp, Users, AlertCircle, Download, Loader2, Camera, Upload,
  EyeOff
} from "lucide-react";
import { api } from "@/lib/api";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type StaffStatus = "Active" | "Inactive";
type SalaryStatus = "Paid" | "Unpaid";
type MainTab = "staff" | "attendance" | "salary";
type PayMethod = "Bank Transfer" | "Cash" | "UPI";

type Staff = {
  id: string;
  name: string;
  phone: string;
  address: string;
  aadharCard: string;
  emailId: string;
  photoUrl: string;
  joiningDate: string;
  salary: number;
  status: StaffStatus;
  password?: string;
};

type Attendance = {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  present: boolean;
  status: "PRESENT" | "ABSENT" | "HALF_DAY";
};

type SalaryRecord = {
  id: string;
  staffId: string;
  staffName: string;
  month: string; // "YYYY-MM"
  amount: number;
  paidDate: string;
  paymentMethod: PayMethod | "";
  status: SalaryStatus;
};

const TODAY = new Date().toISOString().split('T')[0];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function normalizeSalaryStatus(status: string) {
  return status === 'PAID' ? 'Paid' : 'Unpaid';
}

function normalizePaymentMethod(method: string): PayMethod | "" {
  if (!method) return "";
  const m = method.replace(/_/g, ' ').trim().toLowerCase();
  if (m === 'cash') return 'Cash';
  if (m === 'bank transfer' || m === 'banktransfer' || m === 'bank_transfer') return 'Bank Transfer';
  if (m === 'upi' || m === 'u p i') return 'UPI';
  return "";
}

function normalizeSalaryRecord(s: any): SalaryRecord {
  return {
    id: s.id,
    staffId: s.staff_id,
    staffName: s.staff?.name || "Unknown",
    month: s.month,
    amount: parseFloat(s.amount),
    paidDate: s.paid_date?.split('T')[0],
    paymentMethod: normalizePaymentMethod(s.payment_method),
    status: normalizeSalaryStatus(s.status)
  };
}

function getDaysInMonth(month: string) {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon, 0).getDate();
}

function calculateSalaryDetails(staff: Staff, month: string, attendanceRecords: Attendance[]) {
  const monthRecords = attendanceRecords.filter((a) => a.staffId === staff.id && a.date.startsWith(month));
  const absentDays = monthRecords.filter((a) => a.status === 'ABSENT').length;
  const halfDays = monthRecords.filter((a) => a.status === 'HALF_DAY').length;
  const daysInMonth = getDaysInMonth(month);
  const allowedOffDays = Math.ceil(daysInMonth / 7);
  const paidDays = Math.max(1, daysInMonth - allowedOffDays);
  const absenceValue = absentDays + halfDays * 0.5;
  const extraLeaveDays = Math.max(0, absenceValue - allowedOffDays);
  const dailyRate = Math.round((staff.salary / paidDays) * 100) / 100;
  const deduction = Math.round(extraLeaveDays * dailyRate * 100) / 100;
  const netPay = Math.max(0, Math.round((staff.salary - deduction) * 100) / 100);

  return {
    baseSalary: staff.salary,
    daysInMonth,
    allowedOffDays,
    absentDays,
    halfDays,
    absenceValue,
    extraLeaveDays,
    dailyRate,
    deduction,
    netPay,
  };
}

function calcHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [ih, im] = checkIn.split(":").map(Number);
  const [oh, om] = checkOut.split(":").map(Number);
  return Math.round(((oh * 60 + om) - (ih * 60 + im)) / 60 * 10) / 10;
}

function genStaffId(list: Staff[]) {
  const max = list.length ? Math.max(...list.map((s) => parseInt(s.id.split("-")[1]))) : 0;
  return `STF-${String(max + 1).padStart(3, "0")}`;
}

function fmtMonth(m: string) {
  return new Date(m + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-colors";

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, bg, ic, index = 0
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; bg: string; ic: string; index?: number;
}) {
  return (
    <div className={`kpi-card kpi-${(index % 4) + 13}`}>
      <div className="kpi-icon-box">
        <Icon className="w-5 h-5" />
      </div>
      <p className="kpi-value">{value}</p>
      <p className="kpi-label">{label}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function StaffManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("staff");

  // ── Staff State ──────────────────────────────────────────────
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffStatus, setStaffStatus] = useState("All");
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState<Staff>({
    id: "", name: "", phone: "", address: "", aadharCard: "",
    emailId: "", photoUrl: "", joiningDate: TODAY, salary: 0, status: "Active",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);
  const [passwordVisibleIds, setPasswordVisibleIds] = useState<Set<string>>(new Set());

  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markForm, setMarkForm] = useState({
    staffId: "",
    dates: [TODAY],
    status: "PRESENT" as "PRESENT" | "ABSENT" | "HALF_DAY"
  });
  const [dateInput, setDateInput] = useState(TODAY);

  // ── Attendance State ─────────────────────────────────────────
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attDate, setAttDate] = useState(TODAY);
  const [attStaffFilter, setAttStaffFilter] = useState("All");
  const [attView, setAttView] = useState<"daily" | "monthly">("daily");
  const [attMonth, setAttMonth] = useState(TODAY.slice(0, 7));
  const [checkinModal, setCheckinModal] = useState<Staff | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<Attendance | null>(null);
  const [markModal, setMarkModal] = useState<{ staffId: string; staffName: string; status: string } | null>(null);
  const [manualTime, setManualTime] = useState("");

  // ── Salary State ─────────────────────────────────────────────
  const [salaryList, setSalaryList] = useState<SalaryRecord[]>([]);
  const [salaryMonth, setSalaryMonth] = useState(TODAY.slice(0, 7));
  const [salarySearch, setSalarySearch] = useState("");
  const [salaryStatusFilter, setSalaryStatusFilter] = useState("All");
  const [payModal, setPayModal] = useState<SalaryRecord | null>(null);
  const [payStaffModal, setPayStaffModal] = useState<{ staff: Staff; month: string } | null>(null);
  const [payForm, setPayForm] = useState({ paidDate: TODAY, paymentMethod: "Bank Transfer" as PayMethod });
  const [successModal, setSuccessModal] = useState<{ email: string; password: string } | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      const parsed = JSON.parse(u);
      setUserRole(parsed.role);
      if (parsed.role === "STAFF") {
        window.location.href = "/attendance";
      }
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [staffRes, attRes, salRes] = await Promise.all([
          api.get('/staff'),
          api.get('/attendance'),
          api.get('/salaries')
        ]);

        setStaffList(staffRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          address: s.address,
          aadharCard: s.aadhar_card || "",
          emailId: s.email_id || "",
          photoUrl: s.photo_url || "",
          joiningDate: s.joining_date?.split('T')[0],
          salary: parseFloat(s.base_salary),
          status: s.status,
          password: s.plain_password || ""
        })));

        setAttendance(attRes.data.map((a: any) => ({
          id: a.id,
          staffId: a.staff_id,
          staffName: a.staff?.name || "Unknown",
          date: a.date?.split('T')[0],
          checkIn: a.check_in,
          checkOut: a.check_out,
          workingHours: parseFloat(a.working_hours || 0),
          present: a.status === 'PRESENT',
          status: a.status || 'ABSENT'
        })));

        setSalaryList(salRes.data.map((s: any) => normalizeSalaryRecord(s)));

      } catch (error) {
        console.error("Failed to fetch staff data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const dailyRecords = useMemo(() => {
    return attendance.filter((a) => a.date === attDate && (attStaffFilter === "All" || a.staffId === attStaffFilter));
  }, [attendance, attDate, attStaffFilter]);

  const monthlyAttSummary = useMemo(() => {
    const month = attMonth;
    const filtered = attendance.filter((a) => a.date.startsWith(month));

    const summaryMap: Record<string, any> = {};
    staffList.forEach(s => {
      if (attStaffFilter !== "All" && s.id !== attStaffFilter) return;
      summaryMap[s.id] = { staffId: s.id, name: s.name, present: 0, absent: 0, halfDay: 0, hours: 0 };
    });

    filtered.forEach(a => {
      if (summaryMap[a.staffId]) {
        if (a.status === "PRESENT") summaryMap[a.staffId].present++;
        else if (a.status === "ABSENT") summaryMap[a.staffId].absent++;
        else if (a.status === "HALF_DAY") summaryMap[a.staffId].halfDay++;
        summaryMap[a.staffId].hours += a.workingHours;
      }
    });

    return Object.values(summaryMap);
  }, [attendance, attMonth, attStaffFilter, staffList]);

  // ═══════════════════════════════════════════════════════════════
  // ── STAFF LOGIC ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  const filteredStaff = useMemo(() => {
    const q = staffSearch.toLowerCase();
    return staffList.filter((s) => {
      const match = String(s.name).toLowerCase().includes(q) || String(s.phone).includes(q) || String(s.id).toLowerCase().includes(q);
      const st = staffStatus === "All" || s.status === staffStatus;
      return match && st;
    });
  }, [staffList, staffSearch, staffStatus]);

  // Helper to check if a staff's salary is already paid for a given month
  const isSalaryPaidForMonth = useMemo(() => {
    return (staffId: string, month: string) => {
      return salaryList.some((s) => s.staffId === staffId && s.month === month && s.status === "Paid");
    };
  }, [salaryList]);

  function openAddStaff() {
    setEditingStaff(null);
    setStaffForm({ id: "", name: "", phone: "", address: "", aadharCard: "", emailId: "", photoUrl: "", joiningDate: TODAY, salary: 0, status: "Active", password: "" });
    setShowStaffModal(true);
  }

  function openEditStaff(s: Staff) {
    setEditingStaff(s);
    setStaffForm({
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      aadharCard: s.aadharCard || "",
      emailId: s.emailId || "",
      photoUrl: s.photoUrl || "",
      joiningDate: s.joiningDate,
      salary: s.salary,
      status: s.status,
      password: "" // Don't show existing password hash
    });
    setShowStaffModal(true);
  }

  async function saveStaff() {
    if (!staffForm.name.trim() || !staffForm.phone.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: staffForm.name,
        phone: staffForm.phone,
        address: staffForm.address,
        aadhar_card: staffForm.aadharCard,
        email_id: staffForm.emailId,
        photo_url: staffForm.photoUrl,
        joining_date: staffForm.joiningDate,
        base_salary: staffForm.salary,
        status: staffForm.status,
      };

      // Only send password when adding new staff, or when admin explicitly sets one during edit
      if (!editingStaff || staffForm.password?.trim()) {
        payload.password = staffForm.password;
      }

      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, payload);
        setStaffList((p) => p.map((s) => s.id === editingStaff.id ? { ...s, ...staffForm } : s));
      } else {
        const res = await api.post('/staff', payload);
        const newStaff: Staff = {
          ...staffForm,
          id: res.data.id,
          joiningDate: res.data.joining_date?.split('T')[0]
        };
        setStaffList((p) => [newStaff, ...p]);

        if (staffForm.emailId) {
          setSuccessModal({
            email: staffForm.emailId,
            password: staffForm.password || staffForm.phone || "Staff@123"
          });
        }

        // Auto-create unpaid salary record for current month
        const salRes = await api.get('/salaries');
        setSalaryList(salRes.data.map((s: any) => normalizeSalaryRecord(s)));
      }
      setShowStaffModal(false);
    } catch (error: any) {
      alert(error.message || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(staffId: string, status: string) {
    setSaving(true);
    try {
      const res = await api.post('/staff/attendance', {
        staff_id: staffId,
        date: attDate,
        status: status
      });

      const newAtt: Attendance = {
        id: res.data.id,
        staffId: res.data.staff_id,
        staffName: staffList.find(s => s.id === staffId)?.name || "Unknown",
        date: res.data.date?.split('T')[0],
        checkIn: res.data.check_in || "",
        checkOut: res.data.check_out || "",
        workingHours: parseFloat(res.data.working_hours || 0),
        present: res.data.status === 'PRESENT',
        status: res.data.status
      };

      setAttendance((p) => {
        const idx = p.findIndex(a => a.staffId === staffId && a.date === attDate);
        if (idx >= 0) {
          const next = [...p];
          next[idx] = newAtt;
          return next;
        }
        return [...p, newAtt];
      });
    } catch (error: any) {
      alert(error.message || "Failed to update status");
    } finally {
      setSaving(false);
      setMarkModal(null);
    }
  }

  async function deleteStaff(id: string) {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    setSaving(true);
    try {
      await api.delete(`/staff/${id}`);
      setStaffList((p) => p.filter((s) => s.id !== id));
      setDeleteStaffId(null);
    } catch (error: any) {
      alert(error.message || "Failed to delete staff");
    } finally {
      setSaving(false);
    }
  }

  async function doCheckOut(rec: Attendance, time: string) {
    setSaving(true);
    try {
      const res = await api.put(`/attendance/${rec.id}`, {
        check_out: time
      });

      setAttendance((p) =>
        p.map((a) => a.id === rec.id ? {
          ...a,
          checkOut: res.data.check_out,
          workingHours: parseFloat(res.data.working_hours || 0)
        } : a)
      );
    } catch (error: any) {
      alert(error.message || "Failed to check out");
    } finally {
      setSaving(false);
      setCheckoutModal(null);
    }
  }

  async function doCheckIn(staff: Staff, time: string) {
    setSaving(true);
    try {
      const res = await api.post('/staff/attendance', {
        staff_id: staff.id,
        date: attDate,
        check_in: time,
        status: 'PRESENT'
      });

      const newAtt: Attendance = {
        id: res.data.id,
        staffId: res.data.staff_id,
        staffName: staff.name,
        date: res.data.date?.split('T')[0],
        checkIn: res.data.check_in,
        checkOut: res.data.check_out || "",
        workingHours: parseFloat(res.data.working_hours || 0),
        present: true,
        status: 'PRESENT'
      };

      setAttendance((p) => {
        const idx = p.findIndex(a => a.staffId === staff.id && a.date === attDate);
        if (idx >= 0) {
          const next = [...p];
          next[idx] = newAtt;
          return next;
        }
        return [...p, newAtt];
      });
    } catch (error: any) {
      alert(error.message || "Failed to check in");
    } finally {
      setSaving(false);
      setCheckinModal(null);
    }
  }


  // ═══════════════════════════════════════════════════════════════
  // ── SALARY LOGIC ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  const filteredSalary = useMemo(() => {
    const q = salarySearch.toLowerCase();
    return salaryList.filter((s) => {
      const matchMonth = !salaryMonth || s.month === salaryMonth;
      const matchSearch = String(s.staffName).toLowerCase().includes(q) || String(s.staffId).toLowerCase().includes(q);
      const matchStatus = salaryStatusFilter === "All" || s.status === salaryStatusFilter;
      return matchMonth && matchSearch && matchStatus;
    });
  }, [salaryList, salaryMonth, salarySearch, salaryStatusFilter]);

  const totalPayable = filteredSalary.reduce((t, s) => t + s.amount, 0);
  const totalPaid = filteredSalary.filter((s) => s.status === "Paid").reduce((t, s) => t + s.amount, 0);
  const totalPending = filteredSalary.filter((s) => s.status === "Unpaid").reduce((t, s) => t + s.amount, 0);
  const unpaidCount = filteredSalary.filter((s) => s.status === "Unpaid").length;

  async function markPaid(rec: SalaryRecord) {
    setSaving(true);
    try {
      await api.put(`/salaries/${rec.id}`, {
        status: 'Paid',
        paid_date: payForm.paidDate,
        payment_method: payForm.paymentMethod
      });

      setSalaryList((p) =>
        p.map((s) =>
          s.id === rec.id
            ? { ...s, status: "Paid", paidDate: payForm.paidDate, paymentMethod: payForm.paymentMethod }
            : s
        )
      );
    } catch (error: any) {
      alert(error.message || "Failed to mark salary as paid");
    } finally {
      setSaving(false);
      setPayModal(null);
    }
  }

  const payStaffSummary = useMemo(() => {
    if (!payStaffModal) return null;
    return calculateSalaryDetails(payStaffModal.staff, payStaffModal.month, attendance);
  }, [payStaffModal, attendance]);

  function mapPaymentMethod(method: PayMethod) {
    return method === "Bank Transfer" ? "BANK_TRANSFER" : method.toUpperCase();
  }

  async function createSalaryPayment() {
    if (!payStaffModal || !payStaffSummary) return;
    setSaving(true);
    try {
      const staffId = Number(payStaffModal.staff.id);
      const payload = {
        staff_id: Number.isNaN(staffId) ? payStaffModal.staff.id : staffId,
        month: payStaffModal.month,
        amount: payStaffSummary.netPay,
        payment_method: mapPaymentMethod(payForm.paymentMethod),
        paid_date: payForm.paidDate,
        status: 'PAID'
      };

      const res = await api.post('/salaries', payload);
      setSalaryList((p) => [normalizeSalaryRecord(res.data), ...p]);
      setPayStaffModal(null);
    } catch (error: any) {
      alert(error.message || "Failed to process salary payment");
    } finally {
      setSaving(false);
    }
  }

  async function bulkMarkAttendance() {
    if (!markForm.staffId || markForm.dates.length === 0) return;
    setSaving(true);
    try {
      for (const date of markForm.dates) {
        await api.post("/attendance/mark", {
          staff_id: markForm.staffId,
          date: date,
          status: markForm.status
        });
      }

      const res = await api.get("/attendance/all");
      setAttendance(res.data.map((a: any) => ({
        id: a.id,
        staffId: a.staff_id,
        staffName: a.staff?.name || "Unknown",
        date: a.date,
        checkIn: a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
        checkOut: a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
        workingHours: a.working_hours || 0,
        present: a.status === "PRESENT",
        status: a.status
      })));

      setShowMarkModal(false);
      setMarkForm({ staffId: "", dates: [TODAY], status: "PRESENT" });
    } catch (error: any) {
      alert(error.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  }


  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-secondary">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Staff Management</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage staff, attendance and salary in one place</p>
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div className="flex gap-1 bg-background rounded-xl p-1 w-fit">
        {(["staff", "attendance", "salary"] as MainTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${mainTab === tab
              ? "bg-surface text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
              }`}
          >
            {tab === "staff" ? "👤 Staff" : tab === "attendance" ? "🕐 Attendance" : "💰 Salary"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: STAFF MANAGEMENT
      ══════════════════════════════════════════════════════════ */}
      {mainTab === "staff" && (
        <div className="space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Staff", value: staffList.length, sub: "All records", icon: Users, bg: "bg-red-50", ic: "text-primary" },
              { label: "Active Staff", value: staffList.filter((s) => s.status === "Active").length, sub: "Currently working", icon: UserCheck, bg: "bg-emerald-50", ic: "text-emerald-600" },
              { label: "Inactive Staff", value: staffList.filter((s) => s.status === "Inactive").length, sub: "On leave / resigned", icon: AlertCircle, bg: "bg-amber-50", ic: "text-amber-600" },
              { label: "Monthly Payroll", value: fmt(staffList.filter((s) => s.status === "Active").reduce((t, s) => t + s.salary, 0)), sub: "Active staff total", icon: BadgeIndianRupee, bg: "bg-purple-50", ic: "text-purple-600" }
            ].map((k, i) => <StatCard key={k.label} index={i} {...k} />)}
          </div>

          {/* Filters + Add */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input type="text" placeholder="Search by name, phone, ID…" value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)} className={inputCls + " pl-9"} />
            </div>
            <div className="relative">
              <select value={staffStatus} onChange={(e) => setStaffStatus(e.target.value)}
                className={inputCls + " w-40 appearance-none pr-8 cursor-pointer"}>
                {["All", "Active", "Inactive"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
            <button onClick={openAddStaff}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm shadow-red-200 whitespace-nowrap">
              <Plus size={16} /> Add Staff
            </button>
          </div>

          {/* Staff Table */}
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    {["Staff ID", "Name", "Phone", "Address", "Joining Date", "Salary", "Status", "Password", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr><td colSpan={9} className="py-16 text-center text-sm text-text-secondary">No staff found</td></tr>
                  ) : filteredStaff.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-background transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-text-secondary">{s.id}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-text-primary whitespace-nowrap">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-text-secondary whitespace-nowrap">
                          <Phone size={12} className="text-text-secondary" />{s.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary max-w-[160px] truncate">{s.address || "—"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-text-secondary whitespace-nowrap">
                          <CalendarDays size={12} className="text-text-secondary" />{s.joiningDate}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-text-primary whitespace-nowrap">{fmt(s.salary)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === "Active" ? "bg-mint-light text-success" : "bg-background text-text-secondary"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {s.password ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-text-primary">
                              {(passwordVisibleIds as Set<string>).has(s.id) ? s.password : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPasswordVisibleIds((prev: Set<string>) => {
                                  const next = new Set(prev);
                                  if (next.has(s.id)) next.delete(s.id);
                                  else next.add(s.id);
                                  return next;
                                });
                              }}
                              className="text-text-secondary hover:text-text-primary transition-colors p-0.5"
                              title={(passwordVisibleIds as Set<string>).has(s.id) ? "Hide password" : "Show password"}
                            >
                              {(passwordVisibleIds as Set<string>).has(s.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-3">
                          <button onClick={() => setViewStaff(s)} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-red-800 transition-colors">
                            <Eye size={13} /> View
                          </button>
                          <button onClick={() => openEditStaff(s)} className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                            <Pencil size={13} /> Edit
                          </button>
                          <button onClick={() => setDeleteStaffId(s.id)} className="flex items-center gap-1 text-xs font-medium text-coral hover:text-primary transition-colors">
                            <Trash2 size={13} /> Delete
                          </button>
                          {userRole === 'SUPER_ADMIN' && (
                            <>
                              {isSalaryPaidForMonth(s.id, salaryMonth) ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-success bg-mint-light px-3 py-1.5 rounded-lg whitespace-nowrap">
                                  <CheckCircle size={12} /> Paid
                                </span>
                              ) : (
                                <button
                                  onClick={() => setPayStaffModal({ staff: s, month: salaryMonth })}
                                  className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  <BadgeIndianRupee size={12} /> Pay Salary
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStaff.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-background">
                <p className="text-xs text-text-secondary">
                  Showing <span className="font-semibold text-text-primary">{filteredStaff.length}</span> of{" "}
                  <span className="font-semibold text-text-primary">{staffList.length}</span> staff
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: ATTENDANCE
      ══════════════════════════════════════════════════════════ */}
      {mainTab === "attendance" && (
        <div className="space-y-5">

          {/* Today Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {(() => {
              const todayRecs = attendance.filter((a) => a.date === TODAY);
              const present = todayRecs.filter((a) => a.present).length;
              const checkedIn = todayRecs.filter((a) => a.checkIn && !a.checkOut).length;
              const checkedOut = todayRecs.filter((a) => a.checkOut).length;
              const absent = staffList.filter((s) => s.status === "Active").length - present;
              return [
                { label: "Present Today", value: present, icon: CheckCircle, bg: "bg-mint-light", ic: "text-success" },
                { label: "Checked In", value: checkedIn, icon: LogIn, bg: "bg-coral-light", ic: "text-primary" },
                { label: "Checked Out", value: checkedOut, icon: LogOut, bg: "bg-teal-50", ic: "text-teal-600" },
                { label: "Absent Today", value: absent < 0 ? 0 : absent, icon: XCircle, bg: "bg-coral-light", ic: "text-coral" },
              ];
            })().map((s, i) => (
              <StatCard key={s.label} index={i} {...s} />
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Daily / Monthly toggle */}
            <div className="flex gap-1 bg-background rounded-lg p-1">
              {(["daily", "monthly"] as const).map((v) => (
                <button key={v} onClick={() => setAttView(v)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${attView === v ? "bg-surface text-primary shadow-sm" : "text-text-secondary"
                    }`}>{v === "daily" ? "Daily Report" : "Monthly Summary"}</button>
              ))}
            </div>

            {/* Date / Month picker */}
            {attView === "daily" ? (
              <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-red-400 focus:ring-2 focus:ring-primary transition-colors" />
            ) : (
              <input type="month" value={attMonth} onChange={(e) => setAttMonth(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-red-400 focus:ring-2 focus:ring-primary transition-colors" />
            )}

            {/* Staff filter */}
            <div className="relative">
              <select value={attStaffFilter} onChange={(e) => setAttStaffFilter(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-red-400 appearance-none cursor-pointer">
                <option value="All">All Staff</option>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            <div className="flex-1" />

            <button onClick={() => setShowMarkModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm shadow-red-200 whitespace-nowrap">
              <Plus size={16} /> Mark Attendance
            </button>
          </div>

          {/* ── Daily Report ── */}
          {attView === "daily" && (
            <div className="glass-panel overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Daily Attendance Report</h2>
                  <p className="text-xs text-text-secondary mt-0.5">{attDate}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      {["Staff ID", "Name", "Date", "Check-in", "Check-out", "Working Hours", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRecords.length === 0 ? (
                      <tr><td colSpan={8} className="py-12 text-center text-sm text-text-secondary">No records for this date</td></tr>
                    ) : dailyRecords.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-background transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs text-text-secondary">{a.staffId}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {a.staffName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-text-primary whitespace-nowrap">{a.staffName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">{a.date}</td>
                        <td className="px-4 py-3.5">
                          {a.checkIn
                            ? <span className="flex items-center gap-1 text-success font-semibold whitespace-nowrap"><LogIn size={13} />{a.checkIn}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {a.checkOut
                            ? <span className="flex items-center gap-1 text-primary font-semibold whitespace-nowrap"><LogOut size={13} />{a.checkOut}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-text-primary">
                          {a.workingHours > 0 ? `${a.workingHours}h` : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {a.status === "PRESENT" ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle size={13} /> Present</span>
                          ) : a.status === "HALF_DAY" ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-warning"><Clock size={13} /> Half Day</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-coral"><XCircle size={13} /> Absent</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setMarkModal({ staffId: a.staffId, staffName: a.staffName, status: a.status })}
                              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-red-800 bg-coral-light hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <Pencil size={12} /> Mark Status
                            </button>
                            {!a.checkIn && a.status === "PRESENT" && (
                              <button
                                onClick={() => {
                                  const s = staffList.find((st) => st.id === a.staffId);
                                  if (s) { setCheckinModal(s); setManualTime(nowTime()); }
                                }}
                                className="flex items-center gap-1 text-xs font-semibold text-success hover:text-green-800 bg-mint-light hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                              >
                                <LogIn size={12} /> Check In
                              </button>
                            )}
                            {a.checkIn && !a.checkOut && (
                              <button
                                onClick={() => { setCheckoutModal(a); setManualTime(nowTime()); }}
                                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-red-800 bg-coral-light hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                              >
                                <LogOut size={12} /> Check Out
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Monthly Summary ── */}
          {attView === "monthly" && (
            <div className="glass-panel overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Monthly Attendance Summary</h2>
                  <p className="text-xs text-text-secondary mt-0.5">{fmtMonth(attMonth)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      {["Staff ID", "Name", "Present Days", "Absent Days", "Total Hours", "Attendance %"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyAttSummary.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-sm text-text-secondary">No data for this month</td></tr>
                    ) : monthlyAttSummary.map((r) => {
                      const total = r.present + r.absent;
                      const pct = total > 0 ? Math.round((r.present / total) * 100) : 0;
                      return (
                        <tr key={r.staffId} className="border-b border-slate-50 hover:bg-background transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">{r.staffId}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {r.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-text-primary">{r.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-mint-light text-success text-xs font-semibold">{r.present} days</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.absent > 0 ? "bg-coral-light text-primary" : "bg-background text-text-secondary"}`}>
                              {r.absent} days
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-text-primary">{(r.hours ?? 0).toFixed(1)}h</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-[80px] bg-background rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${pct >= 80 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-primary"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${pct >= 80 ? "text-success" : pct >= 60 ? "text-warning" : "text-primary"}`}>
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3: SALARY
      ══════════════════════════════════════════════════════════ */}
      {mainTab === "salary" && (
        <div className="space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard index={0} label="Total Payable" value={fmt(totalPayable)} sub={`${filteredSalary.length} records`} icon={BadgeIndianRupee} bg="bg-coral-light" ic="text-primary" />
            <StatCard index={1} label="Total Paid" value={fmt(totalPaid)} sub="This period" icon={CheckCircle} bg="bg-mint-light" ic="text-success" />
            <StatCard index={2} label="Total Pending" value={fmt(totalPending)} sub={`${unpaidCount} unpaid`} icon={Clock} bg="bg-warning/10" ic="text-warning" />
            <StatCard index={3} label="Staff Count" value={filteredSalary.length} sub="In selected month" icon={Users} bg="bg-purple-50" ic="text-purple-600" />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input type="text" placeholder="Search by name or staff ID…" value={salarySearch}
                onChange={(e) => setSalarySearch(e.target.value)} className={inputCls + " pl-9"} />
            </div>
            <input type="month" value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus:border-red-400 focus:ring-2 focus:ring-primary transition-colors" />
            <div className="relative">
              <select value={salaryStatusFilter} onChange={(e) => setSalaryStatusFilter(e.target.value)}
                className={inputCls + " w-40 appearance-none pr-8 cursor-pointer"}>
                {["All", "Paid", "Unpaid"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          {/* Salary Table */}
          <div className="glass-panel overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Salary Records</h2>
                <p className="text-xs text-text-secondary mt-0.5">{salaryMonth ? fmtMonth(salaryMonth) : "All Months"}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-warning/10 text-warning font-semibold">{unpaidCount} Unpaid</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    {["Staff ID", "Name", "Month", "Salary Amount", "Paid Date", "Payment Method", "Status", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSalary.length === 0 ? (
                    <tr><td colSpan={8} className="py-14 text-center text-sm text-text-secondary">No salary records found</td></tr>
                  ) : filteredSalary.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-background transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-text-secondary">{r.staffId}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {r.staffName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-text-primary whitespace-nowrap">{r.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-primary whitespace-nowrap">{fmtMonth(r.month)}</td>
                      <td className="px-4 py-3.5 font-bold text-text-primary whitespace-nowrap">{fmt(r.amount)}</td>
                      <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">{r.paidDate || "—"}</td>
                      <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">{r.paymentMethod || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.status === "Paid" ? "bg-mint-light text-success" : "bg-warning/10 text-warning"
                          }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {r.status === "Unpaid" ? (
                          userRole === 'SUPER_ADMIN' ? (
                            <button
                              onClick={() => { setPayModal(r); setPayForm({ paidDate: TODAY, paymentMethod: "Bank Transfer" }); }}
                              className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <BadgeIndianRupee size={12} /> Mark Paid
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-warning">Pending</span>
                          )
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-success font-semibold">
                            <CheckCircle size={13} /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSalary.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-background flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">{filteredSalary.length}</span> records
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-success font-semibold">Paid: {fmt(totalPaid)}</span>
                  <span className="text-warning font-semibold">Pending: {fmt(totalPending)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Report Summary Cards */}
          {salaryMonth && (
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4">
                Monthly Salary Report — {fmtMonth(salaryMonth)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredSalary.map((r) => (
                  <div key={r.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${r.status === "Paid" ? "border-green-100 bg-mint-light" : "border-amber-100 bg-warning/10"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.status === "Paid" ? "bg-green-200 text-green-800" : "bg-amber-200 text-amber-800"
                        }`}>
                        {r.staffName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{r.staffName}</p>
                        <p className="text-xs text-text-secondary">{r.paymentMethod || "Not paid yet"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">{fmt(r.amount)}</p>
                      <span className={`text-xs font-semibold ${r.status === "Paid" ? "text-success" : "text-warning"}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════ */}

      {/* ── Add / Edit Staff Modal ── */}
      {showStaffModal && (
        <Modal title={editingStaff ? "Edit Staff" : "Add New Staff"}
          sub={editingStaff ? `Editing ${editingStaff.id}` : "Fill in the staff details"}
          maxW="max-w-4xl"
          onClose={() => setShowStaffModal(false)}>
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-32 shrink-0">
                <Field label="Photo">
                  <ImageUploader value={staffForm.photoUrl} onChange={(url) => setStaffForm((p) => ({ ...p, photoUrl: url }))} />
                </Field>
              </div>
              <div className="flex-1 space-y-4">
                <Field label="Full Name *">
                  <input type="text" placeholder="e.g. Aditi Verma" value={staffForm.name}
                    onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone Number *">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 9876543210"
                      value={staffForm.phone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setStaffForm((p) => ({ ...p, phone: val }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email ID *">
                    <input
                      type="email"
                      placeholder="e.g. staff@example.com"
                      value={staffForm.emailId}
                      onChange={(e) => setStaffForm((p) => ({ ...p, emailId: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Aadhar Card">
                    <input type="text" placeholder="e.g. 1234 5678 9012" value={staffForm.aadharCard} maxLength={12}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setStaffForm((p) => ({ ...p, aadharCard: val }));
                      }} className={inputCls} />
                  </Field>
                  <Field label="Joining Date">
                    <input type="date" value={staffForm.joiningDate}
                      onChange={(e) => setStaffForm((p) => ({ ...p, joiningDate: e.target.value }))} className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Monthly Salary (₹)">
                    <input type="number" min={0} placeholder="0" value={staffForm.salary || ""}
                      onChange={(e) => setStaffForm((p) => ({ ...p, salary: Number(e.target.value) }))} className={inputCls} />
                  </Field>
                  <Field label="Status">
                    <div className="relative">
                      <select value={staffForm.status}
                        onChange={(e) => setStaffForm((p) => ({ ...p, status: e.target.value as StaffStatus }))}
                        className={inputCls + " appearance-none pr-8 cursor-pointer"}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                  </Field>
                </div>
                {/* {!editingStaff && (
                  <Field label="Password *">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Set login password for staff"
                        value={staffForm.password || ""}
                        onChange={(e) => setStaffForm((p) => ({ ...p, password: e.target.value }))}
                        className={inputCls + " pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Field>
                )} */}
                <Field
                  label={
                    editingStaff
                      ? "New Password (leave blank to keep current)"
                      : "Password *"
                  }
                >
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        editingStaff
                          ? "Leave blank to keep current password"
                          : "Set login password for staff"
                      }
                      value={staffForm.password || ""}
                      onChange={(e) =>
                        setStaffForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      className={inputCls + " pr-10"}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
                <Field label="Address">
                  <textarea placeholder="e.g. 22, Rajouri Garden, Delhi" value={staffForm.address}
                    onChange={(e) => setStaffForm((p) => ({ ...p, address: e.target.value }))}
                    rows={3} className={inputCls + " resize-none py-2.5 leading-normal"} />
                </Field>
              </div>
            </div>
          </div>
          <ModalFooter
            onCancel={() => setShowStaffModal(false)}
            onConfirm={saveStaff}
            confirmLabel={saving ? "Saving…" : editingStaff ? "Save Changes" : "Add Staff"}
            disabled={saving || !staffForm.name.trim() || !staffForm.phone.trim() || !staffForm.emailId?.trim() || (!editingStaff && !staffForm.password?.trim())}
          />
        </Modal>
      )}

      {/* ── View Staff Modal ── */}
      {viewStaff && (
        <Modal title={viewStaff.name} sub={`${viewStaff.id} · ${viewStaff.phone}`} onClose={() => { setViewStaff(null); setShowViewPassword(false); }} maxW="max-w-lg">
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-6">
              {viewStaff.photoUrl && (
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-border bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewStaff.photoUrl} alt={viewStaff.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 flex-1">
                {[
                  { label: "Staff ID", value: viewStaff.id },
                  { label: "Phone", value: viewStaff.phone },
                  { label: "Email ID", value: viewStaff.emailId || "—" },
                  { label: "Aadhar Card", value: viewStaff.aadharCard || "—" },
                  { label: "Joining Date", value: viewStaff.joiningDate },
                  { label: "Salary", value: fmt(viewStaff.salary) },
                  { label: "Status", value: viewStaff.status },
                  { label: "Address", value: viewStaff.address || "—" },
                ].map((r) => (
                  <div key={r.label} className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary font-medium">{r.label}</span>
                    <span className="text-sm font-semibold text-text-primary">{r.value}</span>
                  </div>
                ))}
                {/* Password field with show/hide toggle */}
                <div className="flex flex-col gap-0.5 col-span-2">
                  <span className="text-xs text-text-secondary font-medium">Current Password</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary font-mono">
                      {viewStaff.password
                        ? (showViewPassword ? viewStaff.password : "••••••••")
                        : "—"}
                    </span>
                    {viewStaff.password && (
                      <button
                        type="button"
                        onClick={() => setShowViewPassword(!showViewPassword)}
                        className="text-text-secondary hover:text-text-primary p-0.5 transition-colors"
                        title={showViewPassword ? "Hide password" : "Show password"}
                      >
                        {showViewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance summary for this staff */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">This Month's Attendance</p>
              {(() => {
                const recs = attendance.filter((a) => a.staffId === viewStaff.id && a.date.startsWith("2026-04"));
                const present = recs.filter((a) => a.present).length;
                const absent = recs.filter((a) => !a.present).length;
                const hours = recs.reduce((t, a) => t + a.workingHours, 0);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Present", value: `${present} days`, color: "text-success" },
                      { label: "Absent", value: `${absent} days`, color: "text-coral" },
                      { label: "Total Hrs", value: `${hours.toFixed(1)}h`, color: "text-primary" },
                    ].map((m) => (
                      <div key={m.label} className="bg-background rounded-lg p-3 text-center border border-border">
                        <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Salary summary */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Salary (Last 3 Months)</p>
              <div className="space-y-2">
                {salaryList.filter((s) => s.staffId === viewStaff.id).slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border">
                    <span className="text-xs font-medium text-text-primary">{fmtMonth(r.month)}</span>
                    <span className="text-xs font-bold text-text-primary">{fmt(r.amount)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === "Paid" ? "bg-mint-light text-success" : "bg-warning/10 text-warning"}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border">
            <button onClick={() => { setViewStaff(null); setShowViewPassword(false); }} className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Check In Modal ── */}
      {checkinModal && (
        <Modal title="Record Check-In" sub={checkinModal.name} onClose={() => setCheckinModal(null)}>
          <div className="px-6 py-5 space-y-4">
            <Field label="Check-In Time">
              <input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className={inputCls} />
            </Field>
            <p className="text-xs text-text-secondary">Date: <span className="font-semibold text-text-primary">{attDate}</span></p>
          </div>
          <ModalFooter
            onCancel={() => setCheckinModal(null)}
            onConfirm={() => doCheckIn(checkinModal, manualTime)}
            confirmLabel="Confirm Check-In"
            confirmColor="bg-green-600 hover:bg-green-700 shadow-green-200"
            disabled={!manualTime}
          />
        </Modal>
      )}

      {/* ── Check Out Modal ── */}
      {checkoutModal && (
        <Modal title="Record Check-Out" sub={checkoutModal.staffName} onClose={() => setCheckoutModal(null)}>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-lg px-4 py-3 border border-border">
                <p className="text-xs text-text-secondary">Checked In At</p>
                <p className="text-base font-bold text-text-primary mt-0.5">{checkoutModal.checkIn}</p>
              </div>
              <Field label="Check-Out Time">
                <input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className={inputCls} />
              </Field>
            </div>
            {manualTime && checkoutModal.checkIn && (
              <p className="text-xs text-text-secondary">
                Working hours: <span className="font-bold text-primary">{calcHours(checkoutModal.checkIn, manualTime)}h</span>
              </p>
            )}
          </div>
          <ModalFooter
            onCancel={() => setCheckoutModal(null)}
            onConfirm={() => doCheckOut(checkoutModal, manualTime)}
            confirmLabel="Confirm Check-Out"
            disabled={!manualTime}
          />
        </Modal>
      )}

      {/* ── Mark Salary Paid Modal ── */}
      {payModal && (
        <Modal title="Mark Salary as Paid" sub={`${payModal.staffName} · ${fmtMonth(payModal.month)}`} onClose={() => setPayModal(null)}>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-coral-light rounded-xl px-4 py-3 border border-coral flex items-center justify-between">
              <span className="text-sm text-red-700 font-medium">Salary Amount</span>
              <span className="text-lg font-bold text-red-800">{fmt(payModal.amount)}</span>
            </div>
            <Field label="Payment Date">
              <input type="date" value={payForm.paidDate}
                onChange={(e) => setPayForm((p) => ({ ...p, paidDate: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Payment Method">
              <div className="relative">
                <select value={payForm.paymentMethod}
                  onChange={(e) => setPayForm((p) => ({ ...p, paymentMethod: e.target.value as PayMethod }))}
                  className={inputCls + " appearance-none pr-8 cursor-pointer"}>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>UPI</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </Field>
          </div>
          <ModalFooter
            onCancel={() => setPayModal(null)}
            onConfirm={() => markPaid(payModal)}
            confirmLabel="Confirm Payment"
            confirmColor="bg-green-600 hover:bg-green-700 shadow-green-200"
            disabled={!payForm.paidDate}
          />
        </Modal>
      )}

      {payStaffModal && payStaffSummary && (
        <Modal title="Pay Staff Salary" sub={`${payStaffModal.staff.name} · ${fmtMonth(payStaffModal.month)}`} onClose={() => setPayStaffModal(null)}>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs text-text-secondary uppercase tracking-wide">Base Salary</p>
                <p className="mt-2 text-lg font-bold text-text-primary">{fmt(payStaffSummary.baseSalary)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs text-text-secondary uppercase tracking-wide">Net Payable</p>
                <p className="mt-2 text-lg font-bold text-red-800">{fmt(payStaffSummary.netPay)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-text-secondary">Days in month</p>
                <p className="text-base font-semibold text-text-primary">{payStaffSummary.daysInMonth}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-text-secondary">Allowed off days</p>
                <p className="text-base font-semibold text-text-primary">{payStaffSummary.allowedOffDays}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-text-secondary">Absent days</p>
                <p className="text-base font-semibold text-text-primary">{payStaffSummary.absentDays}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-text-secondary">Half days</p>
                <p className="text-base font-semibold text-text-primary">{payStaffSummary.halfDays}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-rose-50 p-4">
              <p className="text-xs text-rose-600 uppercase tracking-wide">Extra leave deduction</p>
              <div className="mt-3 text-sm text-text-primary space-y-1">
                <p>Extra leave days: <span className="font-semibold text-text-primary">{payStaffSummary.extraLeaveDays}</span></p>
                <p>Daily rate: <span className="font-semibold text-text-primary">{fmt(payStaffSummary.dailyRate)}</span></p>
                <p>Deduction: <span className="font-semibold text-text-primary">{fmt(payStaffSummary.deduction)}</span></p>
              </div>
            </div>
            <Field label="Payment Date">
              <input type="date" value={payForm.paidDate}
                onChange={(e) => setPayForm((p) => ({ ...p, paidDate: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Payment Method">
              <div className="relative">
                <select value={payForm.paymentMethod}
                  onChange={(e) => setPayForm((p) => ({ ...p, paymentMethod: e.target.value as PayMethod }))}
                  className={inputCls + " appearance-none pr-8 cursor-pointer"}>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>UPI</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </Field>
          </div>
          <ModalFooter
            onCancel={() => setPayStaffModal(null)}
            onConfirm={createSalaryPayment}
            confirmLabel="Pay Salary"
            confirmColor="bg-green-600 hover:bg-green-700 shadow-green-200"
            disabled={!payForm.paidDate}
          />
        </Modal>
      )}

      {/* ── Delete Staff Confirm ── */}
      {deleteStaffId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-border p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-coral-light mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-coral" />
            </div>
            <h2 className="text-base font-bold text-text-primary text-center">Remove Staff Member?</h2>
            <p className="text-sm text-text-secondary text-center mt-1 mb-6">
              This will permanently remove the staff member and all their records.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteStaffId(null)} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteStaff(deleteStaffId)} className="flex-1 h-10 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary transition-colors">
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Status Modal ── */}
      {markModal && (
        <Modal title="Mark Attendance Status" sub={markModal.staffName} onClose={() => setMarkModal(null)}>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Present", value: "PRESENT", icon: CheckCircle, color: "text-success", bg: "bg-mint-light" },
                { label: "Half Day", value: "HALF_DAY", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
                { label: "Absent", value: "ABSENT", icon: XCircle, color: "text-coral", bg: "bg-coral-light" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateStatus(markModal.staffId, s.value)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${markModal.status === s.value
                    ? "border-red-500 bg-coral-light shadow-sm"
                    : "border-border hover:border-border hover:bg-background"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                      <s.icon size={18} />
                    </div>
                    <span className="font-bold text-text-primary">{s.label}</span>
                  </div>
                  {markModal.status === s.value && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                      <CheckCircle size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary text-center">Date: <span className="font-semibold text-text-primary">{attDate}</span></p>
          </div>
          <div className="px-6 py-4 border-t border-border">
            <button onClick={() => setMarkModal(null)} className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ── Bulk Attendance Modal ── */}
      {showMarkModal && (
        <Modal title="Mark Attendance" sub="Bulk mark attendance for a staff member" onClose={() => setShowMarkModal(false)} maxW="max-w-lg">
          <div className="p-6 space-y-6">
            <Field label="Choose Staff *">
              <div className="relative">
                <select
                  value={markForm.staffId}
                  onChange={(e) => setMarkForm(p => ({ ...p, staffId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select Staff</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Selected Dates *">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className={inputCls}
                  />
                  <button
                    onClick={() => {
                      if (!markForm.dates.includes(dateInput)) {
                        setMarkForm(p => ({ ...p, dates: [...p.dates, dateInput] }));
                      }
                    }}
                    className="px-4 bg-background hover:bg-slate-200 text-text-primary rounded-lg text-sm font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {markForm.dates.map(date => (
                    <div key={date} className="flex items-center gap-1.5 px-2.5 py-1 bg-coral-light text-primary border border-coral rounded-lg text-xs font-medium">
                      {date}
                      <button onClick={() => setMarkForm(p => ({ ...p, dates: p.dates.filter(d => d !== date) }))}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {markForm.dates.length === 0 && (
                    <p className="text-xs text-text-secondary italic">No dates selected</p>
                  )}
                </div>
              </div>
            </Field>

            <Field label="Attendance Status *">
              <div className="flex gap-2 p-1 bg-background rounded-xl">
                {(["PRESENT", "ABSENT", "HALF_DAY"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setMarkForm(p => ({ ...p, status: st }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${markForm.status === st
                      ? st === "PRESENT" ? "bg-green-600 text-white shadow-sm" :
                        st === "ABSENT" ? "bg-primary text-white shadow-sm" :
                          "bg-warning/100 text-white shadow-sm"
                      : "text-text-secondary hover:bg-slate-200"
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <ModalFooter
            onCancel={() => setShowMarkModal(false)}
            onConfirm={bulkMarkAttendance}
            confirmLabel="Mark Attendance"
            disabled={!markForm.staffId || markForm.dates.length === 0}
          />
        </Modal>
      )}

      {/* ── Success Modal (Credentials) ── */}
      {successModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="bg-green-600 p-8 flex flex-col items-center text-white">
              <div className="w-16 h-16 bg-surface/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-bold">Staff Added Successfully!</h2>
              <p className="text-green-100 text-sm mt-1">Login credentials generated</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="bg-background rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Email / Username</p>
                  <p className="text-sm font-bold text-text-primary">{successModal.email}</p>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Temporary Password</p>
                  <p className="text-sm font-bold text-text-primary font-mono tracking-wider">{successModal.password}</p>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary text-center leading-relaxed">
                The staff can now login using these credentials to view their attendance.
              </p>
              <button
                onClick={() => setSuccessModal(null)}
                className="w-full h-12 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
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
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-surface/90 hover:bg-primary-light text-text-secondary hover:text-primary flex items-center justify-center shadow-sm border border-border"
          >
            <X size={13} />
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-surface/90 hover:bg-surface rounded-lg text-xs font-semibold text-text-primary shadow-sm border border-border"
          >
            <Upload size={12} /> Replace
          </button>
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
          className={`flex flex-col items-center justify-center gap-3 w-full aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-all ${dragging
            ? "border-red-400 bg-coral-light"
            : "border-border bg-background hover:border-primary hover:bg-primary-light/50"
            }`}
        >
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center shadow-sm">
            <Camera size={20} className="text-text-secondary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">
              Upload Photo
            </p>
            <p className="text-xs text-text-secondary mt-0.5">PNG, JPG</p>
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE MODAL SHELL
// ═══════════════════════════════════════════════════════════════

function Modal({
  title, sub, onClose, children, maxW = "max-w-md",
}: {
  title: string; sub?: string; onClose: () => void;
  children: React.ReactNode; maxW?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className={`w-full ${maxW} bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-text-primary">{title}</h2>
            {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel, onConfirm, confirmLabel, confirmColor = "bg-primary hover:bg-red-700 shadow-red-200", disabled = false,
}: {
  onCancel: () => void; onConfirm: () => void;
  confirmLabel: string; confirmColor?: string; disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
      <button onClick={onCancel}
        className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors">
        Cancel
      </button>
      <button onClick={onConfirm} disabled={disabled}
        className={`flex-1 h-10 rounded-lg ${confirmColor} text-sm font-semibold text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}>
        {confirmLabel}
      </button>
    </div>
  );
}