"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WeightChart from "@/components/WeightChart";
import { burst, useToast } from "@/components/fx";
import Icon from "@/components/Icon";

const FIELDS = [["weightKg", "weight", "kg"], ["waistCm", "waist", "cm"], ["hipsCm", "hips", "cm"], ["chestCm", "chest", "cm"], ["armCm", "arm", "cm"], ["thighCm", "thigh", "cm"]];

// Resize to max 720px JPEG so photos stay small in the DB
function compress(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 720 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

function Compare({ before, after }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const move = (e) => {
    const b = ref.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    setPos(Math.max(0, Math.min(100, ((cx - b.left) / b.width) * 100)));
  };
  return (
    <div ref={ref} className="card" data-cursor="drag" style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", maxWidth: 420, cursor: "ew-resize", touchAction: "none" }}
      onMouseMove={(e) => e.buttons && move(e)} onMouseDown={move} onTouchMove={move}>
      <img src={after.data} alt="now" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before.data} alt="before" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "#fff" }}>
        <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-lg)", display: "grid", placeItems: "center" }}>⇔</span>
      </div>
      <span className="pill" style={{ position: "absolute", top: 10, left: 10, background: "#fff" }}>before · {before.date}</span>
      <span className="pill lime" style={{ position: "absolute", top: 10, right: 10 }}>now · {after.date}</span>
    </div>
  );
}

export default function Progress({ start, goal, checkins, series, photos: initialPhotos }) {
  const router = useRouter();
  const [f, setF] = useState({ energy: 3, hunger: 3 });
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState(initialPhotos);
  const [angle, setAngle] = useState("front");
  const [toast, toastNode] = useToast();

  const first = checkins[0] || {};
  const last = checkins.at(-1) || {};
  const nowW = series.at(-1)?.w;
  const startW = start.weightKg || series[0]?.w;
  const diff = nowW && startW ? Math.round((nowW - startW) * 10) / 10 : null;

  const byAngle = useMemo(() => photos.filter((p) => p.angle === angle), [photos, angle]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/checkin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast(j.error);
    burst(e.nativeEvent.submitter?.getBoundingClientRect().x || 300, e.nativeEvent.submitter?.getBoundingClientRect().y || 300, ["📏", "✨", "💚"]);
    toast("Check-in sent to your coach");
    setF({ energy: 3, hunger: 3 });
    router.refresh();
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await compress(file);
      const r = await fetch("/api/photos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ data, angle }) });
      const j = await r.json();
      if (!r.ok) return toast(j.error);
      setPhotos((p) => [...p, { _id: j.id, date: j.date, angle: j.angle, data }]);
      toast("Photo saved");
    } catch { toast("Couldn't read that image"); }
    e.target.value = "";
  };
  const del = async (id) => {
    await fetch(`/api/photos?id=${id}`, { method: "DELETE" });
    setPhotos((p) => p.filter((x) => x._id !== id));
  };

  return (
    <div className="dpage">
      {toastNode}
      <div className="ph"><div><h1 className="display">Progress</h1><p>Weight, measurements and photos over time.</p></div></div>

      <div className="card kv" style={{ marginTop: 16 }}>
        <div><b style={{ color: diff != null && diff < 0 ? "var(--brand-600)" : undefined }}>{diff == null ? "–" : `${diff > 0 ? "+" : ""}${diff}`}<small style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}> kg</small></b><span>Since day 1</span></div>
        <div><b>{startW ?? "–"}</b><span>Start weight</span></div>
        <div><b>{nowW ?? "–"}</b><span>Current</span></div>
        <div><b>{goal ?? "–"}</b><span>Goal{goal && nowW ? ` · ${Math.abs(Math.round((nowW - goal) * 10) / 10)} kg to go` : ""}</span></div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: "16px 12px 8px" }}>
        <div style={{ fontWeight: 600, fontSize: 15, padding: "0 4px" }}>Weight trend</div>
        <WeightChart series={series} goal={goal} />
      </div>

      {checkins.length > 1 && (
        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Start vs now</div>
          <div className="grid g3" style={{ marginTop: 12 }}>
            {FIELDS.slice(1).map(([k, l, u]) =>
              first[k] && last[k] ? (
                <div key={k} className="row between card" style={{ padding: 14, boxShadow: "none" }}>
                  <b style={{ textTransform: "capitalize" }}>{l}</b>
                  <span className="mono">{first[k]} → {last[k]}{u} <b style={{ color: last[k] < first[k] ? "var(--brand-600)" : "var(--ink)" }}>({(last[k] - first[k]).toFixed(1)})</b></span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      <div className="grid g2" style={{ marginTop: 16, alignItems: "start" }}>
        <form onSubmit={submit} className="card" style={{ padding: 16 }}>
          <h2 className="display" style={{ fontSize: 18 }}>Weekly check-in</h2>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Once a week, same day, morning. Your coach uses this to tune your plan.</p>
          <div className="grid" style={{ marginTop: 14, gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
            {FIELDS.map(([k, l, u]) => (
              <div key={k}><label className="label">{l} ({u}){k === "weightKg" ? " *" : ""}</label><input className="input" type="number" inputMode="decimal" step="0.1" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} required={k === "weightKg"} /></div>
            ))}
          </div>
          {[["energy", "energy", ["😴", "🥱", "🙂", "😃", "⚡"]], ["hunger", "hunger", ["😌", "🙂", "😐", "😋", "🤤"]]].map(([k, l, em]) => (
            <div key={k} style={{ marginTop: 14 }}>
              <label className="label">{l} this week</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {em.map((x, n) => (
                  <button type="button" key={x} onClick={() => setF({ ...f, [k]: n + 1 })} aria-pressed={f[k] === n + 1} style={{ fontSize: 22, height: 46, borderRadius: 10, border: `1px solid ${f[k] === n + 1 ? "var(--brand)" : "var(--border)"}`, background: f[k] === n + 1 ? "var(--brand-50)" : "#fff", cursor: "pointer" }}>{x}</button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}><label className="label">anything to tell your coach?</label><textarea className="textarea" rows={3} value={f.note || ""} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. had a wedding this weekend" /></div>
          <button className="btn primary" style={{ marginTop: 16, width: "100%" }} disabled={busy}>{busy ? "Sending…" : "Send check-in"}</button>
        </form>

        <div className="card" style={{ padding: 16 }}>
          <div className="row between wrapflex">
            <h2 className="display" style={{ fontSize: 18 }}>Photos</h2>
            <div className="toggle">
              {["front", "side", "back"].map((a) => <button key={a} className={angle === a ? "on" : ""} onClick={() => setAngle(a)}>{a}</button>)}
            </div>
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Same spot, same light, every 2 weeks. Private to you and your coach.</p>
          <label className="btn ghost" style={{ marginTop: 14, width: "100%" }}>
            <Icon name="camera" size={16} /> Add {angle} photo
            <input type="file" accept="image/*" onChange={upload} hidden />
          </label>
          <div style={{ marginTop: 18 }}>
            {byAngle.length >= 2 ? (
              <Compare before={byAngle[0]} after={byAngle.at(-1)} />
            ) : (
              <div className="card" style={{ padding: 24, textAlign: "center", background: "var(--paper)", boxShadow: "none", fontSize: 14, color: "var(--muted)" }}>
                {byAngle.length === 1 ? "Add another photo later to unlock the before / after view." : "No photos yet. Add your first one."}
              </div>
            )}
          </div>
          {byAngle.length > 0 && (
            <div className="row wrapflex" style={{ marginTop: 14, gap: 8 }}>
              {byAngle.map((p) => (
                <div key={p._id} style={{ position: "relative" }}>
                  <img src={p.data} alt={p.date} style={{ width: 70, height: 90, objectFit: "cover", borderRadius: 10, border: "var(--line)" }} />
                  <button onClick={() => del(p._id)} title="delete" style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", border: "var(--line)", background: "#fff", cursor: "pointer", fontSize: 13, lineHeight: 1, boxShadow: "var(--shadow)" }} aria-label="Delete photo">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {checkins.length > 0 && (
        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Check-in history</div>
          <div className="tablewrap">
            <table className="table" style={{ marginTop: 10 }}>
              <thead><tr><th>date</th>{FIELDS.map(([k, l]) => <th key={k}>{l}</th>)}<th>note</th></tr></thead>
              <tbody>
                {[...checkins].reverse().map((c) => (
                  <tr key={c._id}><td className="mono">{c.date}</td>{FIELDS.map(([k]) => <td key={k} className="mono">{c[k] ?? "–"}</td>)}<td>{c.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
