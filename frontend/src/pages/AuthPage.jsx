import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, TrendingUp, Clock3, Play, Loader2, ArrowRight, Phone, Mail, Sparkles,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VIDEO_POSTER =
  "https://images.unsplash.com/photo-1758524151953-d87150127c63?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

function VideoShowcase() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-float bg-slate-900">
      <div
        className="absolute inset-0 bg-cover bg-center animate-kenburns"
        style={{ backgroundImage: `url(${VIDEO_POSTER})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-slate-900/20" />
      <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 border border-white/20">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-white tracking-wide">AI SHOWCASE · LIVE</span>
      </div>
      <button
        data-testid="video-play-button"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-float hover:scale-105 transition-transform"
      >
        <Play className="h-6 w-6 text-[#1D4ED8] fill-[#1D4ED8] ml-1" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-8">
        <p className="text-emerald-300 text-sm font-semibold tracking-wide mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Home chefs. High-volume revenue.
        </p>
        <h2 className="text-white font-display font-extrabold text-3xl lg:text-4xl leading-tight max-w-md">
          Turn your kitchen into a thriving subscription business.
        </h2>

        <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
          {[
            { icon: TrendingUp, label: "Avg. Monthly", value: "₹1.2L+" },
            { icon: ShieldCheck, label: "Verified Chefs", value: "2,400+" },
            { icon: Clock3, label: "Setup Time", value: "< 10 min" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5"
            >
              <m.icon className="h-5 w-5 text-emerald-300 mb-2" />
              <div className="text-white font-display font-bold text-xl">{m.value}</div>
              <div className="text-white/60 text-[11px] font-medium">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OTPDialog({ open, onClose, onVerify, demoOtp, verifying }) {
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(120);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSeconds(120);
    setOtp("");
    timerRef.current = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [open, demoOtp]);

  const mm = String(Math.floor(seconds / 60)).padStart(1, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="otp-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Verify your number</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Enter the 6-digit code we sent via SMS.
          </DialogDescription>
        </DialogHeader>
        {demoOtp && (
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700" data-testid="demo-otp-hint">
            Demo mode: use code <span className="font-mono font-bold">{demoOtp}</span> (any 6 digits work)
          </div>
        )}
        <div className="flex justify-center py-3">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="otp-input">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} data-testid={`otp-slot-${i}`} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-mono" data-testid="otp-timer">
            {seconds > 0 ? `Resend in ${mm}:${ss}` : "Code expired"}
          </span>
          <button
            data-testid="resend-otp-link"
            disabled={seconds > 0}
            onClick={() => setSeconds(120)}
            className="font-semibold text-[#1D4ED8] disabled:text-slate-300 disabled:cursor-not-allowed hover:underline"
          >
            Resend OTP
          </button>
        </div>
        <Button
          data-testid="verify-otp-button"
          onClick={() => onVerify(otp)}
          disabled={otp.length !== 6 || verifying}
          className="w-full bg-[#15803D] hover:bg-[#166534] h-11 mt-1"
        >
          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, chefUUID } = useAuth();
  const [mode, setMode] = useState("signup"); // signup | login
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", mobileNumber: "" });
  const [loginId, setLoginId] = useState("");
  const [mobileValid, setMobileValid] = useState(null);
  const [emailValid, setEmailValid] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [flow, setFlow] = useState(null); // 'signup' | 'login'
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (chefUUID) navigate("/app");
  }, [chefUUID, navigate]);

  const validateMobile = async () => {
    const digits = form.mobileNumber.replace(/\D/g, "");
    if (digits.length !== 10) {
      setMobileValid(false);
      return;
    }
    try {
      const res = await apiClient.get(`/validateMobileNumber/${digits}`);
      setMobileValid(res.data.isMobileNumberValid);
      if (!res.data.isMobileNumberValid) toast.error("Enter a valid 10-digit mobile number");
    } catch {
      setMobileValid(false);
    }
  };

  const validateEmail = async () => {
    if (!form.email) return;
    try {
      const res = await apiClient.get(`/validateEmail/${encodeURIComponent(form.email)}`);
      setEmailValid(res.data.isEmailValid && res.data.accountStatus === "active");
      if (!res.data.isEmailValid) toast.error("Enter a valid email address");
    } catch {
      setEmailValid(false);
    }
  };

  const startSignup = async () => {
    if (!form.firstName || !form.lastName || !form.email || !mobileValid) {
      toast.error("Please complete all fields with a valid mobile number");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/signup", { ...form, captchaToken: "stub-captcha-token" });
      const otpRes = await apiClient.post("/sendOTP", { mobileNumber: form.mobileNumber });
      setDemoOtp(otpRes.data.demoOtp);
      setFlow("signup");
      setOtpOpen(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const startLogin = async () => {
    if (!loginId) {
      toast.error("Enter your phone or email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/login", { identifier: loginId });
      setDemoOtp(res.data.demoOtp);
      setFlow("login");
      setOtpOpen(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || "No account found. Please sign up first.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (otp) => {
    setVerifying(true);
    try {
      if (flow === "signup") {
        await apiClient.post("/verifyOTP", { mobileNumber: form.mobileNumber, otp });
        const lres = await apiClient.post("/loginVerify", { identifier: form.mobileNumber, otp });
        login(lres.data.token, lres.data.chefUUID);
      } else {
        const lres = await apiClient.post("/loginVerify", { identifier: loginId, otp });
        login(lres.data.token, lres.data.chefUUID);
      }
      setOtpOpen(false);
      toast.success("Verified! Checking your location…");
      navigate("/app");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 p-4 lg:p-6 max-w-[1500px] w-full mx-auto">
        {/* Left 60% */}
        <div className="hidden lg:block lg:col-span-3 sticky top-6 h-[calc(100vh-8rem)]">
          <VideoShowcase />
        </div>

        {/* Right 40% */}
        <div className="lg:col-span-2 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-float border border-slate-100 p-8"
          >
            <Logo size={44} />
            <div className="mt-7 flex gap-1 rounded-xl bg-slate-100 p-1">
              <button
                data-testid="tab-signup"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === "signup" ? "bg-white text-[#1D4ED8] shadow-soft" : "text-slate-500"
                }`}
              >
                Create Account
              </button>
              <button
                data-testid="tab-login"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === "login" ? "bg-white text-[#1D4ED8] shadow-soft" : "text-slate-500"
                }`}
              >
                Sign In
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === "signup" ? (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="mt-6 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600">First Name</Label>
                      <Input
                        data-testid="signup-firstname"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Ananya"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-600">Last Name</Label>
                      <Input
                        data-testid="signup-lastname"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Rao"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Email Address</Label>
                    <Input
                      data-testid="signup-email"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailValid(null); }}
                      onBlur={validateEmail}
                      placeholder="you@kitchen.com"
                      className={`mt-1 ${emailValid === true ? "border-emerald-400" : emailValid === false ? "border-red-400" : ""}`}
                    />
                    {emailValid === true && <p className="text-[11px] text-emerald-600 mt-1">✓ Email verified & active</p>}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Mobile Number</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">+91</span>
                      <Input
                        data-testid="signup-mobile"
                        value={form.mobileNumber}
                        onChange={(e) => { setForm({ ...form, mobileNumber: e.target.value }); setMobileValid(null); }}
                        onBlur={validateMobile}
                        maxLength={10}
                        placeholder="9876543210"
                        className={`pl-11 ${mobileValid === true ? "border-emerald-400" : mobileValid === false ? "border-red-400" : ""}`}
                      />
                    </div>
                    {mobileValid === true && <p className="text-[11px] text-emerald-600 mt-1">✓ Valid number — OTP ready</p>}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-slate-500">Protected by Google Invisible Captcha (auto-verified)</span>
                  </div>
                  <Button
                    data-testid="signup-submit-button"
                    onClick={startSignup}
                    disabled={submitting}
                    className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] h-11 group"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>Create Account <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="mt-6 space-y-4"
                >
                  <p className="text-sm text-slate-500">
                    Enter your registered phone or email. We'll send a one-time code.
                  </p>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Phone or Email</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300 opacity-0" />
                      <Input
                        data-testid="login-identifier"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder="9876543210 or you@kitchen.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="login-submit-button"
                    onClick={startLogin}
                    disabled={submitting}
                    className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] h-11"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                  </Button>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700">
                    Demo account → <span className="font-mono font-semibold">demo@casafeast.com</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <LegalFooter className="border-t border-slate-100 bg-white" />

      <OTPDialog
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerify={handleVerify}
        demoOtp={demoOtp}
        verifying={verifying}
      />
    </div>
  );
}
