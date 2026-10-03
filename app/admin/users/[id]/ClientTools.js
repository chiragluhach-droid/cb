"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientTools({ id, stage }) {
  const router = useRouter();
  const [msg, setMsg] = useState({ title: "", body: "" });
  const [st, setSt] = useState(stage);
  const [note, setNote] = useState("");

  const call = async (url, body, method = "POST") => {
    setNote("");
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) return setNote(j.error), false;
    router.refresh();
    return true;
  };

  return (
    <>
      <div className="card" style={{ padding: 18, background: "var(--lilac)" }}>
        <div className="eyebrow">message client</div>
        <input className="input" style={{ marginTop: 10, padding: "10px 12px" }} placeholder="title (optional)" value={msg.title} onChange={(e) => setMsg({ ...msg, title: e.target.value })} />
        <textarea className="textarea" rows={3} style={{ marginTop: 8 }} placeholder="Great week! Let's push steps to 10k…" value={msg.body} onChange={(e) => setMsg({ ...msg, body: e.target.value })} />
        <button className="btn sm" style={{ marginTop: 8 }} onClick={async () => { if (await call(`/api/admin/users/${id}/message`, msg)) { setMsg({ title: "", body: "" }); setNote("sent ✓"); } }}>send to inbox →</button>
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="eyebrow">controls</div>
        <label className="label" style={{ marginTop: 12 }}>phase</label>
        <div className="row">
          <select className="select" value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="fat_loss">fat loss</option><option value="recomp">recomp</option><option value="maintain">maintain</option><option value="build">build muscle</option>
          </select>
          <button className="btn sm" onClick={() => call(`/api/admin/users/${id}`, { stage: st }, "PATCH").then((ok) => ok && setNote("phase saved. generate a new draft to apply it"))}>save</button>
        </div>
        <label className="label" style={{ marginTop: 14 }}>subscription</label>
        <div className="row wrapflex">
          {[7, 30, 90].map((d) => <button key={d} className="btn sm ghost" style={{ border: "var(--line)" }} onClick={() => call(`/api/admin/users/${id}`, { extendDays: d }, "PATCH").then((ok) => ok && setNote(`+${d} days added`))}>+{d}d</button>)}
          <button className="btn sm ghost" onClick={() => window.confirm("End this client's subscription now?") && call(`/api/admin/users/${id}`, { cancel: true }, "PATCH")}>end</button>
        </div>
        {note && <div className="mono" style={{ fontSize: 12, marginTop: 10 }}>{note}</div>}
      </div>
    </>
  );
}
