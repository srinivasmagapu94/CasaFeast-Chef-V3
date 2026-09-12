import React, { useState } from "react";
import { LifeBuoy, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function SupportTicket() {
  const { chefUUID } = useAuth();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!msg.trim()) {
      toast.error("Please describe your issue first");
      return;
    }
    setSending(true);
    try {
      await apiClient.post("/support/ticket", { chefUUID, message: msg });
      toast.success("Support ticket submitted — our team will reach out.");
      setMsg("");
    } catch {
      toast.error("Could not submit ticket");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 border-t border-slate-800">
      <div className="rounded-2xl bg-slate-800/60 p-4" data-testid="support-ticket">
        <div className="flex items-center gap-2 mb-2">
          <LifeBuoy className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Need help?</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <Textarea
          data-testid="support-ticket-input"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Describe your operational issue…"
          className="bg-slate-900/70 border-slate-700 text-slate-200 text-sm resize-none min-h-[72px] placeholder:text-slate-500"
        />
        <Button
          data-testid="support-ticket-submit"
          onClick={submit}
          disabled={sending}
          className="w-full mt-2 bg-[#15803D] hover:bg-[#166534] h-9 text-sm"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Send className="h-3.5 w-3.5" /> Drop Ticket</>)}
        </Button>
      </div>
    </div>
  );
}
