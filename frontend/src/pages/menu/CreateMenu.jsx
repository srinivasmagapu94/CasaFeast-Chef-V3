import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, UtensilsCrossed, Layers } from "lucide-react";
import apiClient, { invalidateCache } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";

export const DURATION_OPTIONS = ["Weekly 5-Days", "Monthly 20-Days", "Quarterly 60-Days"];
export const ITEM_TYPES = ["Veg", "Non-Veg", "Jain"];

export function emptyMenu() {
  return {
    menuName: "", menuDescription: "", menuInclusions: "", priorHoursNotice: "24", isActive: true,
    itemTypes: [], isAvailableForBreakfast: false, isAvailableForLunch: false, isAvailableForDinner: false,
    durations: [{ mealDuration: "", price: "", dailyVolumeLimit: "" }], isAddonAvailable: false, addons: [], menuImageUrl: "",
  };
}

export function MenuFormFields({ data, setData }) {
  const toggleType = (t) => setData({ ...data, itemTypes: data.itemTypes.includes(t) ? data.itemTypes.filter((x) => x !== t) : [...data.itemTypes, t] });
  const setDur = (i, k, v) => { const d = [...data.durations]; d[i] = { ...d[i], [k]: v }; setData({ ...data, durations: d }); };
  const addDur = () => setData({ ...data, durations: [...data.durations, { mealDuration: "", price: "", dailyVolumeLimit: "" }] });
  const rmDur = (i) => setData({ ...data, durations: data.durations.filter((_, x) => x !== i) });
  const setAddon = (i, k, v) => { const a = [...data.addons]; a[i] = { ...a[i], [k]: v }; setData({ ...data, addons: a }); };
  const addAddon = () => setData({ ...data, addons: [...data.addons, { name: "", price: "" }] });
  const rmAddon = (i) => setData({ ...data, addons: data.addons.filter((_, x) => x !== i) });

  return (
    <div className="space-y-6">
      <ImageUpload testid="menu-image-upload" value={data.menuImageUrl} onChange={(url) => setData({ ...data, menuImageUrl: url })} />
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label className="text-xs font-semibold text-slate-600">Menu Name</Label>
          <Input data-testid="menu-name" className="mt-1" value={data.menuName} onChange={(e) => setData({ ...data, menuName: e.target.value })} placeholder="South Indian Homestyle Thali" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Menu Description</Label>
          <Textarea data-testid="menu-description" className="mt-1" value={data.menuDescription} onChange={(e) => setData({ ...data, menuDescription: e.target.value })} placeholder="Marketing pitch for your menu…" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Menu Inclusions</Label>
          <Input data-testid="menu-inclusions" className="mt-1" value={data.menuInclusions} onChange={(e) => setData({ ...data, menuInclusions: e.target.value })} placeholder="Rice, Sambar, 3 Curries, Curd, Papad" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Prior Hours Notice</Label>
            <Input data-testid="menu-notice" className="mt-1" value={data.priorHoursNotice} onChange={(e) => setData({ ...data, priorHoursNotice: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 mt-5">
            <span className="text-sm font-medium text-slate-700">Active</span>
            <Switch data-testid="menu-active" checked={data.isActive} onCheckedChange={(v) => setData({ ...data, isActive: v })} />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-slate-700">Dietary Categories</Label>
        <div className="flex gap-2 mt-2">
          {ITEM_TYPES.map((t) => (
            <button key={t} data-testid={`menu-type-${t.toLowerCase()}`} onClick={() => toggleType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${data.itemTypes.includes(t) ? "bg-[#15803D] text-white border-[#15803D]" : "bg-white text-slate-600 border-slate-200"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-slate-700">Meal Slots</Label>
        <div className="flex flex-wrap gap-4 mt-2">
          {[["Breakfast", "isAvailableForBreakfast"], ["Lunch", "isAvailableForLunch"], ["Dinner", "isAvailableForDinner"]].map(([l, k]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <Checkbox data-testid={`menu-slot-${l.toLowerCase()}`} checked={data[k]} onCheckedChange={(v) => setData({ ...data, [k]: !!v })} />
              <span className="text-sm text-slate-700">{l}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-slate-700">Subscription Duration Plans</Label>
          <Button size="sm" variant="outline" data-testid="add-duration" onClick={addDur}><Plus className="h-3.5 w-3.5" /> Add Plan</Button>
        </div>
        <div className="space-y-2">
          {data.durations.map((d, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end rounded-xl border border-slate-200 p-3" data-testid={`duration-row-${i}`}>
              <div className="col-span-5">
                <Label className="text-[11px] text-slate-500">Duration</Label>
                <Select value={d.mealDuration} onValueChange={(v) => setDur(i, "mealDuration", v)}>
                  <SelectTrigger data-testid={`duration-select-${i}`} className="mt-1"><SelectValue placeholder="Plan" /></SelectTrigger>
                  <SelectContent>{DURATION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-[11px] text-slate-500">Price ₹</Label>
                <Input data-testid={`duration-price-${i}`} className="mt-1" value={d.price} onChange={(e) => setDur(i, "price", e.target.value)} placeholder="2000.00" />
              </div>
              <div className="col-span-3">
                <Label className="text-[11px] text-slate-500">Daily Cap</Label>
                <Input data-testid={`duration-cap-${i}`} className="mt-1" value={d.dailyVolumeLimit} onChange={(e) => setDur(i, "dailyVolumeLimit", e.target.value)} placeholder="25" />
              </div>
              <button data-testid={`duration-remove-${i}`} onClick={() => rmDur(i)} className="col-span-1 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Add-Ons Available</span>
          <Switch data-testid="menu-addons-toggle" checked={data.isAddonAvailable} onCheckedChange={(v) => setData({ ...data, isAddonAvailable: v, addons: v && data.addons.length === 0 ? [{ name: "", price: "" }] : data.addons })} />
        </div>
        {data.isAddonAvailable && (
          <div className="mt-3 space-y-2">
            {data.addons.map((a, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center" data-testid={`addon-row-${i}`}>
                <Input className="col-span-6" data-testid={`addon-name-${i}`} value={a.name} onChange={(e) => setAddon(i, "name", e.target.value)} placeholder="Extra Sweet" />
                <Input className="col-span-5" data-testid={`addon-price-${i}`} value={a.price} onChange={(e) => setAddon(i, "price", e.target.value)} placeholder="40.00" />
                <button data-testid={`addon-remove-${i}`} onClick={() => rmAddon(i)} className="col-span-1 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <Button size="sm" variant="outline" data-testid="add-addon" onClick={addAddon}><Plus className="h-3.5 w-3.5" /> Add Add-on</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateMenu() {
  const { chefUUID } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(emptyMenu());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!data.menuName) return toast.error("Enter a menu name");
    if (!data.durations.some((d) => d.mealDuration && d.price)) return toast.error("Add at least one duration plan with price");
    setSaving(true);
    try {
      await apiClient.post("/menu", { chefUUID, ...data });
      invalidateCache("/menus");
      toast.success("Menu created!");
      navigate("/app/menu/active");
    } catch {
      toast.error("Could not create menu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center"><UtensilsCrossed className="h-5 w-5 text-[#1D4ED8]" /></div>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900">Create Menu</h1>
          <p className="text-slate-500 text-sm">Build a subscription menu with duration plans and add-ons.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 lg:p-8">
        <MenuFormFields data={data} setData={setData} />
        <div className="flex justify-end mt-8 pt-5 border-t border-slate-100">
          <Button data-testid="create-menu-submit" onClick={save} disabled={saving} className="bg-[#15803D] hover:bg-[#166534]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Layers className="h-4 w-4" /> Publish Menu</>)}
          </Button>
        </div>
      </div>
    </div>
  );
}
