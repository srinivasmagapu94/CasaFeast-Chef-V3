import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import apiClient, { API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Multi-photo gallery: upload several images, mark one as the cover (menuImageUrl).
export function MenuGallery({ images = [], cover = "", onChange, testid = "menu-gallery" }) {
  const { chefUUID } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const emit = (imgs, cov) => onChange({ menuImages: imgs, menuImageUrl: cov });

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await apiClient.post(`/upload?chefUUID=${chefUUID || "shared"}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        urls.push(`${API.replace(/\/api$/, "")}${res.data.url}`);
      }
      const next = [...images, ...urls];
      emit(next, cover || next[0]);
      toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (url) => {
    const next = images.filter((u) => u !== url);
    const nextCover = cover === url ? next[0] || "" : cover;
    emit(next, nextCover);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-slate-600">Menu Photo Gallery</p>
        {cover && <span className="text-[11px] text-slate-400">Cover = shown to customers</span>}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {images.map((url) => (
          <div key={url} data-testid={`${testid}-item`} className={`relative rounded-xl overflow-hidden h-24 group border-2 ${cover === url ? "border-[#15803D]" : "border-transparent"}`}>
            <img src={url} alt="menu" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            <button
              data-testid={`${testid}-cover`}
              onClick={() => emit(images, url)}
              title="Set as cover"
              className={`absolute top-1 left-1 h-7 w-7 rounded-full flex items-center justify-center ${cover === url ? "bg-[#15803D] text-white" : "bg-white/90 text-slate-500 opacity-0 group-hover:opacity-100"}`}
            >
              <Star className={`h-3.5 w-3.5 ${cover === url ? "fill-white" : ""}`} />
            </button>
            <button
              data-testid={`${testid}-remove`}
              onClick={() => remove(url)}
              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {cover === url && <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#15803D] text-white px-1.5 py-0.5 rounded-full">COVER</span>}
          </div>
        ))}

        <div
          data-testid={`${testid}-drop`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`cursor-pointer rounded-xl border-2 border-dashed h-24 flex flex-col items-center justify-center transition-all ${dragging ? "border-[#1D4ED8] bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-slate-50/60"}`}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" data-testid={`${testid}-input`} onChange={(e) => handleFiles(e.target.files)} />
          {uploading ? <Loader2 className="h-5 w-5 text-[#1D4ED8] animate-spin" /> : <ImagePlus className="h-5 w-5 text-slate-400" />}
          <span className="text-[11px] text-slate-500 mt-1">Add photos</span>
        </div>
      </div>
    </div>
  );
}
