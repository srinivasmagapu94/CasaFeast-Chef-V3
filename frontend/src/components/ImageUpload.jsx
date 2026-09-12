import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import apiClient, { API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Uploads a single image to persistent object storage and returns its full URL via onChange.
export function ImageUpload({ value, onChange, testid }) {
  const { chefUUID } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const displaySrc = value || "";

  const handleFile = async (fileList) => {
    const f = fileList?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image file");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await apiClient.post(`/upload?chefUUID=${chefUUID || "shared"}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const absolute = `${API.replace(/\/api$/, "")}${res.data.url}`;
      onChange(absolute);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1.5">Menu Photo</p>
      <div
        data-testid={testid}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files); }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed overflow-hidden transition-all ${
          dragging ? "border-[#1D4ED8] bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-slate-50/60"
        } ${displaySrc ? "h-44" : "h-32"}`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" data-testid={`${testid}-input`} onChange={(e) => handleFile(e.target.files)} />
        {displaySrc ? (
          <>
            <img src={displaySrc} alt="menu" data-testid={`${testid}-preview`} className="w-full h-full object-cover" />
            <button
              data-testid={`${testid}-remove`}
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {uploading ? <Loader2 className="h-6 w-6 text-[#1D4ED8] animate-spin" /> : <ImagePlus className="h-6 w-6 text-slate-400" />}
            <p className="text-sm text-slate-500 mt-2"><span className="text-[#1D4ED8] font-semibold">Upload a photo</span> or drag & drop</p>
            <p className="text-[11px] text-slate-400">JPG, PNG · shows on your menu card</p>
          </div>
        )}
      </div>
    </div>
  );
}
