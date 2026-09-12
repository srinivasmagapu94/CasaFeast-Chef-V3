import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, Clock, Trash2, Pencil, PlusCircle, Layers, Archive, Loader2, Timer,
} from "lucide-react";
import apiClient, { invalidateCache } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MenuFormFields, DURATION_OPTIONS, ITEM_TYPES } from "@/pages/menu/CreateMenu";

function MenuCard({ menu, onToggle, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden hover:shadow-float transition-all group" data-testid={`menu-card-${menu.menuId}`}>
      <div className="relative h-40 overflow-hidden">
        <img src={menu.menuImageUrl} alt={menu.menuName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {menu.itemTypes?.map((t) => (
            <span key={t} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t === "Veg" ? "bg-emerald-500" : t === "Non-Veg" ? "bg-red-500" : "bg-amber-500"} text-white`}>{t}</span>
          ))}
        </div>
        {menu.expirationTimestamp && (
          <div className="absolute top-3 right-3 bg-red-500/90 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1" data-testid={`menu-expiry-${menu.menuId}`}>
            <Timer className="h-3 w-3" /> Phasing out {new Date(menu.expirationTimestamp).toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-slate-900 leading-tight">{menu.menuName}</h3>
          <Switch data-testid={`menu-toggle-${menu.menuId}`} checked={menu.isActive} onCheckedChange={() => onToggle(menu)} />
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{menu.menuDescription}</p>

        <div className="flex flex-wrap gap-1 mt-3">
          {(menu.menuInclusions || "").split(",").filter(Boolean).slice(0, 4).map((inc, i) => (
            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{inc.trim()}</span>
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          {menu.durations?.filter((d) => d.mealDuration).map((d, i) => (
            <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-600">{d.mealDuration}</span>
              <span className="font-semibold text-slate-800">₹{d.price} <span className="text-[10px] text-slate-400 font-normal">· cap {d.dailyVolumeLimit}</span></span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
          <Button size="sm" variant="ghost" data-testid={`menu-edit-${menu.menuId}`} onClick={() => onEdit(menu)} className="flex-1 text-slate-600"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          <Button size="sm" variant="ghost" data-testid={`menu-delete-${menu.menuId}`} onClick={() => onDelete(menu)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
        </div>
      </div>
    </div>
  );
}

export default function MenuCatalog({ mode }) {
  const { chefUUID } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [slotFilter, setSlotFilter] = useState([]);
  const [durFilter, setDurFilter] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      invalidateCache("/menus");
      const res = await apiClient.get(`/menus?chefUUID=${chefUUID}`);
      setMenus(res.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [chefUUID]);
  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q), 300); return () => clearTimeout(t); }, [q]);

  const toggleArr = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    return menus.filter((m) => {
      if (mode === "active" && !m.isActive) return false;
      if (mode === "inactive" && m.isActive) return false;
      if (debouncedQ) {
        const hay = `${m.menuName} ${m.menuInclusions}`.toLowerCase();
        if (!hay.includes(debouncedQ.toLowerCase())) return false;
      }
      if (typeFilter.length && !typeFilter.some((t) => m.itemTypes?.includes(t))) return false;
      if (slotFilter.length) {
        const ok = slotFilter.some((s) =>
          (s === "Breakfast" && m.isAvailableForBreakfast) ||
          (s === "Lunch" && m.isAvailableForLunch) ||
          (s === "Dinner" && m.isAvailableForDinner));
        if (!ok) return false;
      }
      if (durFilter.length && !durFilter.some((d) => m.durations?.some((x) => x.mealDuration === d))) return false;
      return true;
    });
  }, [menus, mode, debouncedQ, typeFilter, slotFilter, durFilter]);

  const onToggle = async (m) => {
    await apiClient.patch(`/menu/${m.menuId}/toggle`);
    invalidateCache("/menus");
    toast.success(`Menu ${m.isActive ? "deactivated" : "activated"}`);
    load();
  };
  const onDelete = async () => {
    await apiClient.delete(`/menu/${deleting.menuId}`);
    invalidateCache("/menus");
    toast.success("Menu soft-deleted — will phase out in 7 days");
    setDeleting(null);
    load();
  };
  const saveEdit = async (data) => {
    await apiClient.put(`/menu/${editing.menuId}`, { chefUUID, ...data });
    invalidateCache("/menus");
    toast.success("Menu updated");
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
          {mode === "active" ? <Layers className="h-5 w-5 text-[#1D4ED8]" /> : <Archive className="h-5 w-5 text-[#1D4ED8]" />}
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900">{mode === "active" ? "Active" : "Inactive"} Menu Catalog</h1>
          <p className="text-slate-500 text-sm">{filtered.length} menu{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4 mb-6" data-testid="menu-filter-bar">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input data-testid="menu-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or inclusions…" className="pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            {ITEM_TYPES.map((t) => (
              <button key={t} data-testid={`filter-type-${t.toLowerCase()}`} onClick={() => toggleArr(typeFilter, setTypeFilter, t)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium ${typeFilter.includes(t) ? "bg-[#15803D] text-white border-[#15803D]" : "bg-white text-slate-500 border-slate-200"}`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            {["Breakfast", "Lunch", "Dinner"].map((s) => (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox data-testid={`filter-slot-${s.toLowerCase()}`} checked={slotFilter.includes(s)} onCheckedChange={() => toggleArr(slotFilter, setSlotFilter, s)} />
                <span className="text-xs text-slate-600">{s}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            {DURATION_OPTIONS.map((d) => (
              <button key={d} data-testid={`filter-dur-${d.split(" ")[0].toLowerCase()}`} onClick={() => toggleArr(durFilter, setDurFilter, d)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium ${durFilter.includes(d) ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "bg-white text-slate-500 border-slate-200"}`}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#1D4ED8]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400" data-testid="menu-empty">No menus found. Try adjusting filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((m) => (
            <MenuCard key={m.menuId} menu={m} onToggle={onToggle} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="menu-edit-modal">
          <DialogHeader><DialogTitle className="font-display">Edit Menu</DialogTitle></DialogHeader>
          {editing && <EditForm menu={editing} onSave={saveEdit} />}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent data-testid="menu-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this menu?</AlertDialogTitle>
            <AlertDialogDescription>This soft-deletes "{deleting?.menuName}". It will phase out from the customer feed in 7 days.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="menu-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid="menu-delete-confirm-btn" onClick={onDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditForm({ menu, onSave }) {
  const [data, setData] = useState({
    menuName: menu.menuName, menuDescription: menu.menuDescription, menuInclusions: menu.menuInclusions,
    priorHoursNotice: menu.priorHoursNotice || "24", isActive: menu.isActive, itemTypes: menu.itemTypes || [],
    isAvailableForBreakfast: menu.isAvailableForBreakfast, isAvailableForLunch: menu.isAvailableForLunch, isAvailableForDinner: menu.isAvailableForDinner,
    durations: menu.durations?.length ? menu.durations : [{ mealDuration: "", price: "", dailyVolumeLimit: "" }],
    isAddonAvailable: menu.isAddonAvailable, addons: menu.addons || [], menuImageUrl: menu.menuImageUrl, menuImages: menu.menuImages || [],
  });
  return (
    <div>
      <MenuFormFields data={data} setData={setData} />
      <div className="flex justify-end mt-6"><Button data-testid="menu-edit-save" onClick={() => onSave(data)} className="bg-[#15803D] hover:bg-[#166534]">Save Changes</Button></div>
    </div>
  );
}
