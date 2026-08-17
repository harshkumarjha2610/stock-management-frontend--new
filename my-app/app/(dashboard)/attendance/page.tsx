"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  CheckCircle2, XCircle, AlertCircle, Clock
} from "lucide-react";
import dayjs from "dayjs";

type AttendanceRecord = {
  id: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY";
  check_in?: string;
  check_out?: string;
  working_hours?: number;
};

type StoredUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  store_id: number;
};

export default function AttendancePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      fetchAttendance(u.id);
    }
  }, []);

  const fetchAttendance = async (userId: number) => {
    try {
      setLoading(true);
      // Get own staff profile
      const staffRes = await api.get('/staff/me');
      const staffMember = staffRes.data;
      
      if (staffMember) {
        const res = await api.get(`/staff/${staffMember.id}/attendance`);
        const mapped = res.data.reduce((acc: any, rec: AttendanceRecord) => {
          acc[rec.date] = rec;
          return acc;
        }, {});
        setAttendance(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = currentDate.daysInMonth();
  const startOfMonth = currentDate.startOf("month").day();
  const days = [];

  // Padding for start of month
  for (let i = 0; i < startOfMonth; i++) {
    days.push(null);
  }

  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(currentDate.date(i));
  }

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));
  const nextMonth = () => setCurrentDate(currentDate.add(1, "month"));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-mint-light text-success border-mint";
      case "ABSENT": return "bg-coral-light text-red-700 border-coral";
      case "HALF_DAY": return "bg-warning/10 text-warning border-warning";
      default: return "bg-background text-text-secondary border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT": return <CheckCircle2 size={14} />;
      case "ABSENT": return <XCircle size={14} />;
      case "HALF_DAY": return <Clock size={14} />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Attendance</h1>
          <p className="text-sm text-text-secondary mt-1">Track your daily presence and working hours</p>
        </div>
        <div className="flex items-center gap-4 glass-panel p-1 border-none">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-text-primary" />
          </button>
          <div className="px-4 flex flex-col items-center min-w-[140px]">
            <span className="text-sm font-bold text-text-primary">{currentDate.format("MMMM YYYY")}</span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-text-primary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-success">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Present Days</p>
                <p className="text-xl font-bold text-text-primary">
                  {Object.values(attendance).filter(a => a.status === "PRESENT" && dayjs(a.date).isSame(currentDate, 'month')).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-warning">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Half Days</p>
                <p className="text-xl font-bold text-text-primary">
                  {Object.values(attendance).filter(a => a.status === "HALF_DAY" && dayjs(a.date).isSame(currentDate, 'month')).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-primary">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Absent Days</p>
                <p className="text-xl font-bold text-text-primary">
                  {Object.values(attendance).filter(a => a.status === "ABSENT" && dayjs(a.date).isSame(currentDate, 'month')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" /> Attendance Legend
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-mint-light0"></div>
                <span className="text-slate-300">Present (Full Day)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning/100"></div>
                <span className="text-slate-300">Half Day (4-6 Hours)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-slate-300">Absent (No Record)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="glass-panel overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-background/50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="py-3 text-center text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 p-2 gap-2">
              {days.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} className="aspect-square"></div>;
                
                const dateKey = day.format("YYYY-MM-DD");
                const record = attendance[dateKey];
                const isToday = day.isSame(dayjs(), "day");
                
                return (
                  <div key={dateKey} className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all relative ${
                    record ? getStatusColor(record.status) : (isToday ? "border-coral bg-coral-light/30" : "border-border")
                  }`}>
                    <span className={`text-sm font-bold ${isToday ? "text-primary" : (record ? "" : "text-text-primary")}`}>
                      {day.date()}
                    </span>
                    {record && (
                      <div className="flex flex-col items-center gap-0.5">
                        {getStatusIcon(record.status)}
                        <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80">
                          {record.status.replace("_", " ")}
                        </span>
                      </div>
                    )}
                    {isToday && !record && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
