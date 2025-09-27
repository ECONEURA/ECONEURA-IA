"use client";
import { useState } from "react";

type Props = { agentKey: string; initialEnabled?: boolean };

export default function AgentKillToggle({ agentKey, initialEnabled=false }: Props) {
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);
  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  async function toggle(next: boolean) {
    try {
      setBusy(true); setMsg("");
      const res = await fetch("/api/admin/finops/killswitch", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_key: agentKey, enabled: next })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEnabled(next);
      setMsg(next ? "Agente bloqueado (kill-switch ON)" : "Agente habilitado (kill-switch OFF)");
    } catch (e:any) {
      setMsg(`Error: ${e.message ?? "toggle failed"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <div className="font-medium">Kill-switch</div>
      <button
        disabled={busy}
        onClick={()=>toggle(!enabled)}
        className={`px-3 py-1 rounded-xl text-sm ${enabled ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}
        aria-pressed={enabled}
        aria-label="Kill-switch"
      >
        {enabled ? "ON (bloqueado)" : "OFF (habilitado)"}
      </button>
      {busy && <span className="text-xs opacity-70">actualizando…</span>}
      {!!msg && <span className="text-xs opacity-70">{msg}</span>}
    </div>
  );
}
