import React, { useRef, useState } from "react";
import { UploadCloud, File as FileIcon, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import apiClient from "@/lib/api";
import { toast } from "sonner";

export function FileUpload({ label, accept, files, onChange, testid }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList) => {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of arr) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await apiClient.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        uploaded.push(res.data);
      }
      onChange([...(files || []), ...uploaded]);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (id) => onChange((files || []).filter((f) => f.fileId !== id));

  return (
    <div>
      {label && <p className="text-xs font-semibold text-slate-600 mb-1.5">{label}</p>}
      <div
        data-testid={testid}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          dragging ? "border-[#1D4ED8] bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-slate-50/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          multiple
          data-testid={`${testid}-input`}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-7 w-7 mx-auto text-[#1D4ED8] animate-spin" />
        ) : (
          <UploadCloud className="h-7 w-7 mx-auto text-slate-400" />
        )}
        <p className="text-sm text-slate-500 mt-2">
          <span className="text-[#1D4ED8] font-semibold">Click to upload</span> or drag & drop
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">{accept || "PDF, JPG, PNG"}</p>
      </div>

      {(files || []).length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((f) => (
            <div key={f.fileId} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2" data-testid={`${testid}-file`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <FileIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700 truncate flex-1">{f.fileName}</span>
              <span className="text-[11px] text-slate-400">{Math.round((f.size || 0) / 1024)} KB</span>
              <button
                data-testid={`${testid}-delete`}
                onClick={(e) => { e.stopPropagation(); remove(f.fileId); }}
                className="h-7 w-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
