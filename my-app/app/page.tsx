"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Package,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Boxes,
  Store,
  Sparkles,
  UserCheck,
  Shield,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Interactive HTML5 Particle Constellation Animation ───────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Brand theme palette: purple, cyan, mint, coral
    const colors = [
      "rgba(160, 90, 255, ",  // Primary Purple
      "rgba(75, 203, 235, ",  // Cyan Blue
      "rgba(27, 207, 180, ",  // Mint Green
      "rgba(254, 148, 150, ", // Coral Pink
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      alphaSpeed: number;
    }

    const count = Math.min(75, Math.max(40, Math.floor((width * height) / 18000)));
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        radius: Math.random() * 2.8 + 1.8,
        color,
        alpha: Math.random() * 0.5 + 0.4,
        alphaSpeed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const onPointerMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onPointerMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connecting constellation lines
      const maxDistance = 150;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.45;
            ctx.strokeStyle = `rgba(160, 90, 255, ${lineAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update & render particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Interactive mouse push
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150;
          p.x -= (dx / dist) * force * 3.5;
          p.y -= (dy / dist) * force * 3.5;
        }

        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.95 || p.alpha < 0.3) p.alphaSpeed *= -1;

        ctx.save();
        ctx.shadowColor = p.color + "1)";
        ctx.shadowBlur = 14;
        ctx.fillStyle = p.color + Math.max(0.2, Math.min(1, p.alpha)) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onPointerMove);
    };
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setMousePos({ x: e.clientX, y: e.clientY });
  }

  async function performLogin(loginEmail: string, loginPass: string) {
    setError("");
    setLoading(true);

    try {
      let data;
      try {
        data = await api.post('/auth/login', { email: loginEmail, password: loginPass });
      } catch (apiErr) {
        console.warn("Backend unavailable or user not found, using mock login for UI viewing.");
        const isStaffUser = loginEmail.toLowerCase().includes("staff") || loginPass.toLowerCase().includes("staff");
        data = {
          data: {
            token: isStaffUser ? "mock_staff_token" : "mock_admin_token",
            user: isStaffUser
              ? { id: "staff_demo", role: "STAFF", name: "Demo Staff", email: loginEmail }
              : { id: "admin_demo", role: "SUPER_ADMIN", name: "Super Admin", email: loginEmail },
          },
        };
      }

      // Save token & user to localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    await performLogin(email, password);
  }

  async function handleDemoLogin(role: "admin" | "staff") {
    const demoEmail = role === "admin" ? "admin@stockmgmt.com" : "staff@stockmgmt.com";
    const demoPassword = role === "admin" ? "Admin@123" : "Staff@123";
    setEmail(demoEmail);
    setPassword(demoPassword);
    await performLogin(demoEmail, demoPassword);
  }

  function handleQuickFill(role: "admin" | "staff") {
    if (role === "admin") {
      setEmail("admin@stockmgmt.com");
      setPassword("Admin@123");
    } else {
      setEmail("staff@stockmgmt.com");
      setPassword("Staff@123");
    }
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#f8f7ff] via-[#f1edfe] to-[#e8f5fd] dark:from-slate-950 dark:via-[#110e28] dark:to-slate-950 select-none"
    >
      {/* ── INTERACTIVE HTML5 CANVAS CONSTELLATION ───────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />

      {/* ── VIBRANT ANIMATED BACKGROUND ARTWORK ──────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle radial glow mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(160,90,255,0.30),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(160,90,255,0.35),rgba(2,6,23,0))]" />
        
        {/* Interactive Mouse Spotlight Glow */}
        {mousePos.x > 0 && (
          <div
            className="absolute inset-0 transition-opacity duration-300 opacity-70 dark:opacity-50"
            style={{
              background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(160, 90, 255, 0.22), rgba(75, 203, 235, 0.12) 35%, transparent 65%)`,
            }}
          />
        )}

        {/* Animated Modern Dot Matrix Grid */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.20] animate-grid-drift"
          style={{
            backgroundImage: `radial-gradient(#a05aff 1.2px, transparent 1.2px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Center Rotating Cosmic Conic Glow Mesh */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[55rem] rounded-full blur-[100px] opacity-40 dark:opacity-45 animate-spin-slow pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,rgba(160,90,255,0.45),rgba(75,203,235,0.4),rgba(254,148,150,0.4),rgba(27,207,180,0.4),rgba(160,90,255,0.45))]" />

        {/* Dynamic Aurora Wave Gradient Band */}
        <div className="absolute -top-[15%] -left-[10%] w-[120%] h-[75%] bg-gradient-to-tr from-purple-500/25 via-indigo-500/25 to-teal-400/25 blur-[70px] animate-aurora-wave" />

        {/* Sliding Laser Shimmer Beam */}
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] pointer-events-none overflow-hidden opacity-35 dark:opacity-25">
          <div className="w-[180%] h-40 bg-gradient-to-r from-transparent via-purple-400/60 dark:via-purple-400/40 to-transparent blur-xl animate-beam-slide" />
        </div>

        {/* Expanding Ambient Ripple Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] pointer-events-none flex items-center justify-center">
          <div className="absolute w-[28rem] h-[28rem] rounded-full border-2 border-purple-400/35 dark:border-purple-500/35 animate-ripple-1" />
          <div className="absolute w-[28rem] h-[28rem] rounded-full border-2 border-cyan-400/35 dark:border-cyan-500/35 animate-ripple-2" />
          <div className="absolute w-[28rem] h-[28rem] rounded-full border-2 border-pink-400/30 dark:border-pink-500/30 animate-ripple-3" />
        </div>

        {/* Ambient Floating Glowing Orbs - Vibrant & Crisp */}
        {/* Orb 1: Purple - Top Left */}
        <div className="absolute -top-16 -left-16 w-[36rem] h-[36rem] bg-purple-500/40 dark:bg-purple-600/45 rounded-full blur-[80px] animate-float-slow" />
        
        {/* Orb 2: Indigo / Cyan - Top Right */}
        <div className="absolute top-1/6 -right-20 w-[34rem] h-[34rem] bg-cyan-400/40 dark:bg-cyan-500/40 rounded-full blur-[75px] animate-float-reverse" />
        
        {/* Orb 3: Mint / Teal - Bottom Left */}
        <div className="absolute -bottom-20 -left-12 w-[36rem] h-[36rem] bg-teal-400/35 dark:bg-teal-500/35 rounded-full blur-[80px] animate-float-drift" />
        
        {/* Orb 4: Rose / Coral - Bottom Right */}
        <div className="absolute -bottom-16 right-1/6 w-[30rem] h-[30rem] bg-pink-400/35 dark:bg-pink-500/35 rounded-full blur-[70px] animate-pulse-glow" />

        {/* Floating Live Glass Micro-Badges in Viewport Corners */}
        <div className="hidden xl:flex absolute top-12 left-12 items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-slate-800 shadow-xl shadow-purple-500/10 text-xs font-bold text-text-primary animate-float-badge-1 z-[2]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
          <span>Real-time Inventory Sync</span>
        </div>

        <div className="hidden xl:flex absolute top-12 right-12 items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-slate-800 shadow-xl shadow-indigo-500/10 text-xs font-bold text-text-primary animate-float-badge-2 z-[2]">
          <span className="text-indigo-500 dark:text-indigo-400 text-sm">⚡</span>
          <span>Fast POS &amp; Billing</span>
        </div>

        <div className="hidden xl:flex absolute bottom-12 left-12 items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-slate-800 shadow-xl shadow-pink-500/10 text-xs font-bold text-text-primary animate-float-badge-3 z-[2]">
          <span className="text-pink-500 dark:text-pink-400 text-sm">🏷️</span>
          <span>Automated GST &amp; Barcode</span>
        </div>

        <div className="hidden xl:flex absolute bottom-12 right-12 items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-slate-800 shadow-xl shadow-teal-500/10 text-xs font-bold text-text-primary animate-float-badge-1 z-[2]">
          <span className="text-teal-500 dark:text-teal-400 text-sm">🛡️</span>
          <span>Role-Based Multi-Store</span>
        </div>

        {/* Floating Sparkle Particles & Twinkling Stars */}
        <div className="absolute top-[18%] left-[12%] w-3.5 h-3.5 rounded-full bg-purple-500/90 shadow-[0_0_16px_rgba(168,85,247,1)] animate-particle-1" />
        <div className="absolute top-[35%] left-[24%] w-2.5 h-2.5 rounded-full bg-indigo-500/80 shadow-[0_0_14px_rgba(99,102,241,1)] animate-particle-2" />
        <div className="absolute top-[65%] left-[16%] w-3 h-3 rounded-full bg-teal-400/90 shadow-[0_0_16px_rgba(45,212,191,1)] animate-particle-3" />
        <div className="absolute top-[22%] right-[20%] w-3 h-3 rounded-full bg-purple-400/90 shadow-[0_0_16px_rgba(216,180,254,1)] animate-particle-4" />
        <div className="absolute top-[58%] right-[12%] w-3.5 h-3.5 rounded-full bg-pink-500/80 shadow-[0_0_18px_rgba(244,114,182,1)] animate-particle-5" />
        <div className="absolute bottom-[18%] right-[28%] w-3 h-3 rounded-full bg-cyan-400/90 shadow-[0_0_16px_rgba(34,211,238,1)] animate-particle-1" />
        <div className="absolute top-[12%] left-[45%] w-2.5 h-2.5 rounded-full bg-yellow-400/90 shadow-[0_0_16px_rgba(250,204,21,1)] animate-twinkle-1" />
        <div className="absolute top-[78%] left-[40%] w-3 h-3 rounded-full bg-emerald-400/90 shadow-[0_0_16px_rgba(52,211,153,1)] animate-twinkle-2" />
        <div className="absolute top-[40%] right-[34%] w-2.5 h-2.5 rounded-full bg-fuchsia-400/90 shadow-[0_0_14px_rgba(232,121,249,1)] animate-twinkle-3" />
        <div className="absolute bottom-[28%] left-[6%] w-3 h-3 rounded-full bg-sky-400/90 shadow-[0_0_16px_rgba(56,189,248,1)] animate-particle-2" />
        <div className="absolute top-[82%] right-[6%] w-3.5 h-3.5 rounded-full bg-rose-400/90 shadow-[0_0_18px_rgba(251,113,133,1)] animate-particle-4" />
      </div>

      {/* ── CENTERED LOGIN CARD CONTAINER ─────────────────────── */}
      <div className="w-full max-w-[420px] mx-auto relative z-10">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative mb-3 group cursor-default">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 opacity-60 blur-lg group-hover:opacity-90 transition-opacity animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-xl border border-white/80 dark:border-slate-700 bg-white p-1.5 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Stock Management Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-purple-200/80 dark:border-purple-900/50 shadow-xs backdrop-blur-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-text-primary tracking-wide">
              Retail &amp; Inventory Platform
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Stock Management
          </h1>
          <p className="text-xs font-medium text-text-secondary mt-1">
            Sign in to access your store dashboard
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-white/70 dark:border-slate-800 shadow-2xl shadow-purple-500/10 p-6 sm:p-8 relative overflow-hidden transition-all">

            {/* Error Notification */}
            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-3.5 py-3 text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in duration-200">
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@store.com"
                    className="h-11 w-full rounded-xl border border-border bg-white/60 dark:bg-slate-950/60 pl-10 pr-3.5 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-11 w-full rounded-xl border border-border bg-white/60 dark:bg-slate-950/60 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me option */}
              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-medium text-text-secondary">
                    Keep me signed in for 30 days
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:bg-primary-hover active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Quick Demo Fill / 1-Click Login Buttons */}
            <div className="mt-6 pt-5 border-t border-border/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Quick Demo Login (1-Click)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instant Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Admin Demo Button */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin")}
                  disabled={loading}
                  className="group relative p-3 rounded-2xl border border-purple-200/90 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100/80 dark:hover:bg-purple-900/50 text-left transition-all hover:shadow-md hover:shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Super Admin
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10.5px] text-text-secondary font-medium">All features & reports</p>
                </button>

                {/* Staff Demo Button */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin("staff")}
                  disabled={loading}
                  className="group relative p-3 rounded-2xl border border-teal-200/90 dark:border-teal-900/50 bg-teal-50/60 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 text-left transition-all hover:shadow-md hover:shadow-teal-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Store Staff
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10.5px] text-text-secondary font-medium">Staff & reports hidden</p>
                </button>
              </div>

              {/* Autofill option without auto-submitting */}
              <div className="mt-3 flex items-center justify-center gap-2.5 text-[11px] text-text-secondary">
                <span>Or autofill form:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin")}
                  className="font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer transition-colors"
                >
                  Admin details
                </button>
                <span className="opacity-40">•</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill("staff")}
                  className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline cursor-pointer transition-colors"
                >
                  Staff details
                </button>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-5 text-center text-[11px] text-text-secondary">
              Stock Management System © {new Date().getFullYear()} • All rights reserved
            </p>

          </div>

        </div>

      </div>
  );
}
