import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Clock3, Loader2, ArrowRight, Phone, Mail, Sparkles,
} from "lucide-react";
import apiClient, { chefServicesClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { renderTurnstile, removeTurnstile } from "@/services/cloudflareTurnstile";

const STORY = [
  { img: "/story/cook.jpeg", step: "01", tag: "COOK", title: "Cook what you love, from home", desc: "Prepare fresh homemade meals in your own kitchen — no restaurant, no overheads.", metric: ["Home kitchens", "100%"], color: "#15803D" },
  { img: "/story/menu.jpeg", step: "02", tag: "LIST", title: "Upload your menu in minutes", desc: "Photograph your dishes, set subscription plans and go live on the Casafeast marketplace.", metric: ["Setup time", "< 10 min"], color: "#1D4ED8" },
  { img: "/story/order.jpeg", step: "03", tag: "ORDERS", title: "Receive & ship daily orders", desc: "Accept subscription orders and hand off to a delivery partner in one tap.", metric: ["Avg. orders/day", "40+"], color: "#D97706" },
  { img: "/story/earn.jpeg", step: "04", tag: "EARN", title: "Grow real monthly income", desc: "Track earnings, payouts and subscriptions — turn your cooking into a thriving business.", metric: ["Avg. monthly", "₹1.2L+"], color: "#15803D" },
];

const MOBILE_VALIDATION_TOAST_ID = "mobile-validation-error";
const TURNSTILE_SITE_KEY = process.env.REACT_APP_CLOUDFLARE_TURNSTILE_SITE_KEY;

function TurnstileWidget({ onToken, onError }) {
  const containerRef = useRef(null);
  const widgetPromiseRef = useRef(null);
  const widgetIdRef = useRef(null);
  const cleanupTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(cleanupTimerRef.current);

    if (widgetPromiseRef.current) return undefined;

    widgetPromiseRef.current = renderTurnstile(containerRef.current, TURNSTILE_SITE_KEY, {
      onToken: (token) => {
        console.log("[Turnstile] token received", { hasToken: Boolean(token), length: token?.length || 0 });
        onToken(token);
      },
      onExpired: () => {
        console.warn("[Turnstile] token expired");
        onToken("");
      },
      onError: () => {
        console.error("[Turnstile] token generation failed");
        onError("");
      },
    })
      .then((id) => {
        widgetIdRef.current = id;
        return id;
      })
      .catch(() => {
        onError("");
        widgetPromiseRef.current = null;
      });

    return () => {
      cleanupTimerRef.current = setTimeout(() => {
        removeTurnstile(widgetIdRef.current);
        widgetIdRef.current = null;
        widgetPromiseRef.current = null;
      }, 0);
    };
  }, [onToken, onError]);

  return <div ref={containerRef} data-testid="turnstile-widget" />;
}

function VideoShowcase() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % STORY.length), 3600);
    return () => clearInterval(id);
  }, []);
  const s = STORY[idx];
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-float bg-slate-900" data-testid="story-showcase">
      {STORY.map((sc, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${sc.img})`, opacity: i === idx ? 1 : 0 }}
        >
          {i === idx && <div className="absolute inset-0 bg-cover bg-center animate-kenburns" style={{ backgroundImage: `url(${sc.img})` }} />}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/45 to-slate-900/20" />

      <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 border border-white/20">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-white tracking-wide">HOW CASAFEAST WORKS</span>
      </div>

      {/* Journey rail */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
        {STORY.map((sc, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            data-testid={`story-dot-${i}`}
            className={`flex items-center gap-2 transition-all ${i === idx ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
          >
            <span className={`text-[11px] font-semibold ${i === idx ? "text-white" : "text-white/60"}`}>{sc.tag}</span>
            <span className="h-1.5 rounded-full transition-all" style={{ width: i === idx ? 28 : 10, backgroundColor: i === idx ? sc.color : "rgba(255,255,255,0.4)" }} />
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-display font-black text-5xl leading-none" style={{ color: s.color }}>{s.step}</span>
              <span className="text-emerald-300 text-sm font-semibold tracking-widest uppercase">{s.tag}</span>
            </div>
            <h2 className="text-white font-display font-extrabold text-3xl lg:text-4xl leading-tight max-w-md">{s.title}</h2>
            <p className="text-white/70 mt-3 max-w-md text-sm">{s.desc}</p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-300" />
              <div>
                <div className="text-white font-display font-bold text-lg leading-none">{s.metric[1]}</div>
                <div className="text-white/60 text-[11px]">{s.metric[0]}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
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
  const [captchaToken, setCaptchaToken] = useState("");
  const mobileValidationId = useRef(0);

  useEffect(() => {
    if (chefUUID) navigate("/app");
  }, [chefUUID, navigate]);

  const validateMobile = async () => {
    const validationId = ++mobileValidationId.current;
    const digits = form.mobileNumber.replace(/\D/g, "");
    if (digits.length !== 10) {
      setMobileValid(false);
      return;
    }
    try {
      const res = await chefServicesClient.post(`/validateMobileNumber/${encodeURIComponent(digits)}`);
      if (validationId !== mobileValidationId.current) return;
      const isMobileNumberValid = res.data.mobileNumberValid === true;
      setMobileValid(isMobileNumberValid);
      if (isMobileNumberValid) {
        toast.dismiss(MOBILE_VALIDATION_TOAST_ID);
      } else {
        toast.error("Account on this number already created, please login.", { id: MOBILE_VALIDATION_TOAST_ID });
      }
    } catch {
      if (validationId !== mobileValidationId.current) return;
      setMobileValid(false);
      toast.error("Unable to validate this mobile number");
    }
  };

  const validateEmail = async () => {
    if (!form.email) return;
    try {
      const res = await chefServicesClient.post(`/validateEmail/${encodeURIComponent(form.email)}`);
      const isEmailValid = res.data.emailValid === true;
      setEmailValid(isEmailValid);
      if (!isEmailValid) {
        toast.error("Account with this email already created, please login.");
      }
    } catch {
      setEmailValid(false);
      toast.error("Unable to validate this email address");
    }
  };

  const startSignup = async () => {
    console.log("[Signup] captcha token state", { hasToken: Boolean(captchaToken), length: captchaToken.length });
    if (!form.firstName || !form.lastName || !form.email || !mobileValid || !captchaToken) {
      toast.error("Please complete all fields and verify the captcha");
      return;
    }
    setSubmitting(true);
    try {
      const chefRes = await chefServicesClient.post("/saveChef", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.mobileNumber,
        captchaToken,
      });
      const otpRes = await apiClient.post("/sendOTP", { mobileNumber: form.mobileNumber });
      setDemoOtp(otpRes.data.demoOtp);
      setFlow("signup");
      setOtpOpen(true);
      return chefRes.data.chefUUID;
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
                        onChange={(e) => { mobileValidationId.current += 1; setForm({ ...form, mobileNumber: e.target.value }); setMobileValid(null); }}
                        onBlur={validateMobile}
                        maxLength={10}
                        placeholder="9876543210"
                        className={`pl-11 ${mobileValid === true ? "border-emerald-400" : mobileValid === false ? "border-red-400" : ""}`}
                      />
                    </div>
                    {mobileValid === true && <p className="text-[11px] text-emerald-600 mt-1">✓ Valid number — OTP ready</p>}
                  </div>
                  <TurnstileWidget onToken={setCaptchaToken} onError={setCaptchaToken} />
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
      <LegalFooter variant="fancy" className="border-t border-slate-100 bg-[#F8FAFC]/80 backdrop-blur" />

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
