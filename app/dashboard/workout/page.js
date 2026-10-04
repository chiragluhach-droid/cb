import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { activePlan, workoutWeek } from "@/lib/userData";
import { weekdayIndex } from "@/lib/dates";
import { DAYS } from "@/lib/planEngine";
import Icon from "@/components/Icon";


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
    <div className="dpage">
      <div className="ph">
        <div>
          <h1 className="display">Workout</h1>
          <p>{w.place === "gym" ? "Gym" : "Home"} programme · {w.daysPerWeek} days a week · week {week} of 4</p>
        </div>
      </div>

      <div className="scroller" style={{ marginTop: 16 }}>
        {w.progression.map((x) => (
          <div key={x.week} className="card" style={{ padding: "12px 14px", width: 150, boxShadow: "none", borderColor: x.week === week ? "var(--brand)" : undefined, background: x.week === week ? "var(--brand-50)" : "#fff", opacity: x.week < week ? 0.6 : 1 }}>
            <div className="row between" style={{ fontSize: 13, fontWeight: 600 }}>Week {x.week}{x.week < week && <Icon name="check" size={14} stroke={2.5} />}{x.week === week && <span className="pill lime" style={{ fontSize: 11, padding: "0 7px" }}>Now</span>}</div>
            <div className="mono" style={{ fontSize: 13, marginTop: 4 }}>{x.sets} sets × {x.reps}</div>
            <div className="muted clamp2" style={{ fontSize: 12, marginTop: 4 }}>{x.note}</div>
          </div>
        ))}
      </div>

      <div className="sec-title"><h2>Sessions</h2><span>{w.sessions.length} this week</span></div>
      <div className="grid g2" style={{ gap: 12 }}>
        {w.sessions.map((s) => (
          <div key={s.day} className="card" style={{ overflow: "hidden", borderColor: s.day === today ? "var(--brand)" : undefined }}>
            <div className="row between" style={{ padding: "12px 16px", background: s.day === today ? "var(--brand-50)" : "var(--paper)", borderBottom: "var(--line)" }}>
              <b style={{ textTransform: "capitalize" }}>{s.day} · {s.focus}</b>
              {s.day === today && <span className="pill lime">Today</span>}
            </div>
            <div className="list">
              {s.exercises.map((x) => (
                <div key={x.name} className="row-item">
                  <span style={{ fontWeight: 500, minWidth: 0 }}>{x.name}</span>
                  <span className="mono" style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 13 }}>
                    {x.timed ? `${p.sets} × ${30 + week * 5}s` : `${p.sets} × ${p.reps}`}
                    <span className="muted" style={{ display: "block", fontSize: 11.5 }}>rest {x.rest}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card list" style={{ marginTop: 16 }}>
        <div style={{ padding: "12px 16px" }}><div style={{ fontWeight: 600, fontSize: 14 }}>Warm-up</div><p className="muted" style={{ fontSize: 14, marginTop: 2 }}>{w.warmup}</p></div>
        <div style={{ padding: "12px 16px" }}><div style={{ fontWeight: 600, fontSize: 14 }}>Cool-down</div><p className="muted" style={{ fontSize: 14, marginTop: 2 }}>{w.cooldown}</p></div>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>Feel sharp pain (not muscle burn)? Stop and message your coach.</p>
    </div>
  );
}
