import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Check, ChevronRight, ChevronLeft, Plus, X, ShieldCheck, Landmark, MapPinned,
  ClipboardList, User, FileCheck2, Loader2,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FileUpload } from "@/components/FileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CITIES = ["Visakhapatnam", "Bangalore"];
const AREAS = {
  Visakhapatnam: ["MVP Colony", "Gajuwaka", "Madhurawada", "Dwaraka Nagar"],
  Bangalore: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout"],
};
const FOOD_TYPES = ["Homemade Food", "Bakery", "Snacks", "Sweets", "Tiffins"];
const CATEGORIES = ["Cooked Meals", "Bakery", "Beverages", "Snacks", "Dairy"];

function StepBadge({ active, done, index, label, icon: Icon }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
        done ? "bg-[#15803D] text-white" : active ? "bg-[#1D4ED8] text-white shadow-lg shadow-blue-900/20" : "bg-slate-100 text-slate-400"
      }`}>
        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="hidden xl:block">
        <div className="text-[10px] text-slate-400 font-semibold">STEP {index + 1}</div>
        <div className={`text-sm font-semibold ${active || done ? "text-slate-800" : "text-slate-400"}`}>{label}</div>
      </div>
    </div>
  );
}

// ---------------- Step 1 ----------------
function Step1({ data, setData }) {
  const addFoodType = (ft) => {
    if (data.foodTypes.find((f) => f.foodType === ft)) {
      setData({ ...data, foodTypes: data.foodTypes.filter((f) => f.foodType !== ft) });
    } else {
      setData({ ...data, foodTypes: [...data.foodTypes, { foodType: ft, chefItem: [""], chefCuisines: [""] }] });
    }
  };
  const updateFT = (i, key, arr) => {
    const copy = [...data.foodTypes];
    copy[i] = { ...copy[i], [key]: arr };
    setData({ ...data, foodTypes: copy });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-slate-600">City</Label>
          <Select value={data.city} onValueChange={(v) => setData({ ...data, city: v, area: "" })}>
            <SelectTrigger data-testid="prescreen-city" className="mt-1"><SelectValue placeholder="Select city" /></SelectTrigger>
            <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Area</Label>
          <Select value={data.area} onValueChange={(v) => setData({ ...data, area: v })} disabled={!data.city}>
            <SelectTrigger data-testid="prescreen-area" className="mt-1"><SelectValue placeholder="Select area" /></SelectTrigger>
            <SelectContent>{(AREAS[data.city] || []).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">Prior Culinary Experience</span>
          <Switch data-testid="prescreen-experience" checked={data.priorExperience} onCheckedChange={(v) => setData({ ...data, priorExperience: v })} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">Has FSSAI Certificate</span>
          <Switch data-testid="prescreen-fssai" checked={data.hasFSSAI} onCheckedChange={(v) => setData({ ...data, hasFSSAI: v })} />
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-slate-700">Inventory Mapping — Food Types</Label>
        <p className="text-xs text-slate-400 mb-2">Select one or more food tiers you'll offer.</p>
        <div className="flex flex-wrap gap-2">
          {FOOD_TYPES.map((ft) => {
            const on = data.foodTypes.find((f) => f.foodType === ft);
            return (
              <button key={ft} data-testid={`foodtype-${ft.replace(/\s/g, "-").toLowerCase()}`} onClick={() => addFoodType(ft)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${on ? "bg-[#15803D] text-white border-[#15803D]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                {ft}
              </button>
            );
          })}
        </div>
        <div className="mt-3 space-y-3">
          {data.foodTypes.map((ft, i) => (
            <div key={ft.foodType} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="font-semibold text-sm text-slate-700 mb-2">{ft.foodType}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-slate-500">Dishes (comma separated)</Label>
                  <Input data-testid={`fooditem-${i}`} className="mt-1 bg-white" placeholder="Idli, Dosa, Biryani"
                    value={ft.chefItem.join(", ")} onChange={(e) => updateFT(i, "chefItem", e.target.value.split(",").map((s) => s.trim()))} />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Cuisines (comma separated)</Label>
                  <Input data-testid={`foodcuisine-${i}`} className="mt-1 bg-white" placeholder="South Indian, Andhra"
                    value={ft.chefCuisines.join(", ")} onChange={(e) => updateFT(i, "chefCuisines", e.target.value.split(",").map((s) => s.trim()))} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#15803D] p-6 text-white shadow-float" data-testid="commission-banner">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
          <ShieldCheck className="h-4 w-4" /> Financial Transparency
        </div>
        <p className="font-display font-bold text-lg leading-snug">
          Casafeast standard marketplace commission is calculated as <span className="text-emerald-200">20% on each order payout value + 18% GST</span>.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[["Order Value", "₹1,000"], ["Commission (20%)", "₹200"], ["GST (18%)", "₹36"]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/10 border border-white/15 py-2.5">
              <div className="text-lg font-bold">{v}</div>
              <div className="text-[10px] text-white/70">{k}</div>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-slate-200 p-4">
        <Checkbox data-testid="accept-terms" checked={data.acceptedTerms} onCheckedChange={(v) => setData({ ...data, acceptedTerms: !!v })} className="mt-0.5" />
        <span className="text-sm text-slate-600">I have read and accept the commission structure (20% + 18% GST) and Casafeast partner terms.</span>
      </label>
    </div>
  );
}

// ---------------- Step 2 ----------------
function Step2({ data, setData }) {
  const setAddr = (k, v) => setData({ ...data, kitchenAddress: { ...data.kitchenAddress, [k]: v } });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" testid="p-firstname" value={data.firstName} onChange={(v) => setData({ ...data, firstName: v })} />
        <Field label="Last Name" testid="p-lastname" value={data.lastName} onChange={(v) => setData({ ...data, lastName: v })} />
        <Field label="Phone Number" testid="p-phone" value={data.phoneNumber} onChange={(v) => setData({ ...data, phoneNumber: v })} />
        <Field label="Email Address" testid="p-email" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
        <div>
          <Label className="text-xs font-semibold text-slate-600">Gender</Label>
          <Select value={data.gender} onValueChange={(v) => setData({ ...data, gender: v })}>
            <SelectTrigger data-testid="p-gender" className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["Male", "Female", "Other"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Marital Status</Label>
          <Select value={data.maritalStatus} onValueChange={(v) => setData({ ...data, maritalStatus: v })}>
            <SelectTrigger data-testid="p-marital" className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["Single", "Married"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">Family Operating Unit</span>
          <Switch data-testid="p-family" checked={data.isFamilyUnit} onCheckedChange={(v) => setData({ ...data, isFamilyUnit: v })} />
        </div>
        <Field label="Aadhaar Number" testid="p-aadhaar" value={data.aadhaarNumber} onChange={(v) => setData({ ...data, aadhaarNumber: v })} />
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3"><MapPinned className="h-4 w-4 text-[#1D4ED8]" /><span className="font-semibold text-sm text-slate-700">Kitchen Address</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Kitchen Name" testid="k-name" value={data.kitchenAddress.kitchenName} onChange={(v) => setAddr("kitchenName", v)} />
          <Field label="Address Line 1" testid="k-addr1" value={data.kitchenAddress.addressLine1} onChange={(v) => setAddr("addressLine1", v)} />
          <Field label="Address Line 2" testid="k-addr2" value={data.kitchenAddress.addressLine2} onChange={(v) => setAddr("addressLine2", v)} />
          <Field label="State" testid="k-state" value={data.kitchenAddress.state} onChange={(v) => setAddr("state", v)} />
          <Field label="City" testid="k-city" value={data.kitchenAddress.city} onChange={(v) => setAddr("city", v)} />
          <Field label="Pincode" testid="k-pincode" value={data.kitchenAddress.pincode} onChange={(v) => setAddr("pincode", v)} />
        </div>
      </div>

      <FileUpload label="KYC Documents (Aadhaar / PAN)" accept="PDF, JPG, PNG" testid="kyc-upload"
        files={data.kycDocuments} onChange={(f) => setData({ ...data, kycDocuments: f })} />
    </div>
  );
}

// ---------------- Step 3 ----------------
function Step3({ data, setData }) {
  const toggleCat = (c) => {
    const on = data.approvedCategories.includes(c);
    setData({ ...data, approvedCategories: on ? data.approvedCategories.filter((x) => x !== c) : [...data.approvedCategories, c] });
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="FSSAI License Number" testid="fssai-number" value={data.fssaiLicenseNumber} onChange={(v) => setData({ ...data, fssaiLicenseNumber: v })} />
        <div>
          <Label className="text-xs font-semibold text-slate-600">License Status</Label>
          <Select value={data.licenseStatus} onValueChange={(v) => setData({ ...data, licenseStatus: v })}>
            <SelectTrigger data-testid="fssai-status" className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["Active", "Pending", "Expired"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Expiry Date</Label>
          <Input type="date" data-testid="fssai-expiry" className="mt-1" value={data.expiryDate} onChange={(e) => setData({ ...data, expiryDate: e.target.value })} />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold text-slate-700">Approved Product Categories</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map((c) => {
            const on = data.approvedCategories.includes(c);
            return (
              <button key={c} data-testid={`fssai-cat-${c.replace(/\s/g, "-").toLowerCase()}`} onClick={() => toggleCat(c)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${on ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <FileUpload label="FSSAI Certificate (PDF)" accept="PDF" testid="fssai-upload"
        files={data.fssaiDocuments} onChange={(f) => setData({ ...data, fssaiDocuments: f })} />
    </div>
  );
}

// ---------------- Step 4 ----------------
function Step4({ data, setData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Legal Account Holder Name" testid="bank-holder" value={data.accountHolderName} onChange={(v) => setData({ ...data, accountHolderName: v })} />
        <Field label="Bank Institution Name" testid="bank-name" value={data.bankName} onChange={(v) => setData({ ...data, bankName: v })} />
        <Field label="Bank Account Number" testid="bank-account" value={data.accountNumber} onChange={(v) => setData({ ...data, accountNumber: v })} />
        <Field label="IFSC Code" testid="bank-ifsc" value={data.ifscCode} onChange={(v) => setData({ ...data, ifscCode: v })} />
      </div>
      <FileUpload label="Passbook / Cancelled Cheque Proof" accept="PDF, JPG, PNG" testid="bank-upload"
        files={data.passbookDocuments} onChange={(f) => setData({ ...data, passbookDocuments: f })} />
    </div>
  );
}

function Field({ label, testid, value, onChange }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      <Input data-testid={testid} className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ---------------- Verification Board ----------------
function VerificationBoard({ chefUUID }) {
  const { refreshChef } = useAuth();
  const [v, setV] = useState({ kyc: false, bank: false, field: false });

  const load = async () => {
    try {
      const res = await apiClient.get(`/onboarding/status/${chefUUID}`, { force: true });
      setV(res.data.verification);
      if (res.data.isActivated) refreshChef();
    } catch {}
  };
  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tracks = [
    { key: "kyc", label: "KYC Verification", desc: "Identity & address documents", icon: User },
    { key: "bank", label: "Bank Verification", desc: "Penny-drop account check", icon: Landmark },
    { key: "field", label: "Field Verification", desc: "Kitchen hygiene inspection", icon: MapPinned },
  ];

  return (
    <div className="max-w-2xl mx-auto text-center" data-testid="verification-board">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
        <FileCheck2 className="h-8 w-8 text-[#1D4ED8]" />
      </div>
      <h2 className="font-display font-extrabold text-2xl text-slate-900">Onboarding submitted!</h2>
      <p className="text-slate-500 mt-2">Our team is reviewing your application. Track your verification below.</p>

      <div className="mt-8 space-y-3 text-left">
        {tracks.map((t) => {
          const done = v[t.key];
          return (
            <div key={t.key} data-testid={`verify-track-${t.key}`} className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${done ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                {done ? <Check className="h-5 w-5" /> : <t.icon className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">{t.label}</div>
                <div className="text-sm text-slate-400">{t.desc}</div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {done ? "Verified" : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-6">
        Live status auto-refreshes. An admin approves tracks from the Admin panel (<span className="font-mono">/admin</span>) in this demo.
      </p>
    </div>
  );
}

// ---------------- Main ----------------
export default function Onboarding() {
  const { chef, chefUUID } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(chef?.onboardingSubmitted || false);

  const [s1, setS1] = useState({ city: "", area: "", priorExperience: false, hasFSSAI: false, foodTypes: [], acceptedTerms: false });
  const [s2, setS2] = useState({ firstName: chef?.firstName || "", lastName: chef?.lastName || "", phoneNumber: chef?.mobileNumber || "", email: chef?.email || "", gender: "", maritalStatus: "", isFamilyUnit: false, aadhaarNumber: "", kitchenAddress: { kitchenName: "", addressLine1: "", addressLine2: "", state: "", city: "", pincode: "" }, kycDocuments: [] });
  const [s3, setS3] = useState({ fssaiLicenseNumber: "", licenseStatus: "", expiryDate: "", approvedCategories: [], fssaiDocuments: [] });
  const [s4, setS4] = useState({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", passbookDocuments: [] });

  if (submitted || chef?.onboardingSubmitted) {
    return <VerificationBoard chefUUID={chefUUID} />;
  }

  const steps = [
    { label: "Pre-Screening", icon: ClipboardList },
    { label: "Personal & KYC", icon: User },
    { label: "FSSAI", icon: FileCheck2 },
    { label: "Bank Details", icon: Landmark },
  ];

  const next = async () => {
    if (step === 0) {
      if (!s1.city || !s1.area) return toast.error("Select city and area");
      if (!s1.acceptedTerms) return toast.error("Please accept the commission terms to continue");
      await apiClient.post("/onboarding/prescreening", { chefUUID, ...s1 });
    }
    if (step === 1) {
      if (!s2.firstName || !s2.phoneNumber) return toast.error("Fill personal details");
      await apiClient.post("/onboarding/personal", { chefUUID, ...s2 });
    }
    if (step === 2) {
      if (!s3.fssaiLicenseNumber) return toast.error("Enter FSSAI license number");
      await apiClient.post("/onboarding/fssai", { chefUUID, ...s3 });
    }
    setStep(step + 1);
    toast.success("Progress saved");
  };

  const submit = async () => {
    if (!s4.accountHolderName || !s4.accountNumber || !s4.ifscCode) return toast.error("Fill bank details");
    setSubmitting(true);
    try {
      await apiClient.post("/onboarding/bank", { chefUUID, ...s4 });
      setSubmitted(true);
      toast.success("Onboarding submitted for verification!");
    } catch {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-extrabold text-2xl text-slate-900">Chef Onboarding</h1>
      <p className="text-slate-500 mb-6">Complete all 4 steps to get verified and go live.</p>

      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <StepBadge index={i} label={s.label} icon={s.icon} active={step === i} done={step > i} />
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded ${step > i ? "bg-[#15803D]" : "bg-slate-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            {step === 0 && <Step1 data={s1} setData={setS1} />}
            {step === 1 && <Step2 data={s2} setData={setS2} />}
            {step === 2 && <Step3 data={s3} setData={setS3} />}
            {step === 3 && <Step4 data={s4} setData={setS4} />}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
          <Button variant="ghost" data-testid="onboarding-back" disabled={step === 0} onClick={() => setStep(step - 1)} className="text-slate-500">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < 3 ? (
            <Button data-testid="onboarding-next" onClick={next} className="bg-[#1D4ED8] hover:bg-[#1E40AF]">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button data-testid="onboarding-submit" onClick={submit} disabled={submitting} className="bg-[#15803D] hover:bg-[#166534]">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Submit for Verification <Check className="h-4 w-4" /></>)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
