import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { activePlan, workoutWeek } from "@/lib/userData";
import { weekdayIndex } from "@/lib/dates";
import { DAYS } from "@/lib/planEngine";

const COLORS = ["var(--lime)", "var(--pink)", "var(--sky)", "var(--butter)", "var(--lilac)"];

export default async function Page() {
  await db();
  const user = await getUser();
  const plan = await activePlan(user._id);
  if (!plan) redirect("/dashboard");
  const w = plan.workout;
  const week = workoutWeek(plan);
  const p = w.progression[week - 1];
  const today = DAYS[weekdayIndex()];

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="row wrapflex" style={{ gap: 8 }}>
        <span className="pill lime">{w.place === "gym" ? "🏋️ gym" : "🏠 home"}</span>
        <span className="pill gray">{w.daysPerWeek} days / week</span>
      </div>
      <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 76px)", marginTop: 12 }}>move <span className="serif">that</span> body</h1>

      <div className="card" style={{ marginTop: 24, padding: 20 }}>
        <div className="eyebrow">4-week block · you&apos;re in week {week}</div>
        <div className="grid g4" style={{ marginTop: 14 }}>
          {w.progression.map((x) => (
            <div key={x.week} className="card" style={{ padding: 14, boxShadow: x.week === week ? "var(--shadow)" : "none", background: x.week === week ? "var(--lime)" : x.week < week ? "var(--paper-2)" : "#fffdf7", opacity: x.week < week ? 0.6 : 1 }}>
              <div className="display" style={{ fontSize: 22 }}>wk {x.week} {x.week < week ? "✓" : ""}</div>
              <div className="mono" style={{ fontSize: 13 }}>{x.sets} sets × {x.reps}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{x.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 22 }}>
        {w.sessions.map((s, k) => (
          <div key={s.day} className="card reveal" style={{ padding: 20, background: s.day === today ? COLORS[k % 5] : "#fffdf7", transitionDelay: `${k * 60}ms` }}>
            <div className="row between">
              <span className="display" style={{ fontSize: 26 }}>{s.day} · {s.focus}</span>
              {s.day === today && <span className="pill" style={{ background: "#fffdf7" }}>today</span>}
            </div>
            <table className="table" style={{ marginTop: 10 }}>
              <tbody>
                {s.exercises.map((x) => (
                  <tr key={x.name}>
                    <td><b>{x.name}</b></td>
                    <td className="mono">{x.timed ? `${p.sets} × ${30 + week * 5}s` : `${p.sets} × ${p.reps}`}</td>
                    <td className="mono muted">rest {x.rest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="grid g2" style={{ marginTop: 22 }}>
        <div className="card" style={{ padding: 18 }}><div className="eyebrow">🔥 warm-up</div><p style={{ marginTop: 6 }}>{w.warmup}</p></div>
        <div className="card" style={{ padding: 18 }}><div className="eyebrow">🧊 cool-down</div><p style={{ marginTop: 6 }}>{w.cooldown}</p></div>
      </div>
      <p className="mono muted" style={{ fontSize: 12, marginTop: 16 }}>Something hurts (not muscle burn, actual pain)? Stop, and message your coach.</p>
    </div>
  );
}
