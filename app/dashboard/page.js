import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { activePlan, streak, plain, workoutWeek } from "@/lib/userData";
import { istDate, weekdayIndex } from "@/lib/dates";
import { coachName } from "@/lib/plans";
import DailyLog from "@/models/DailyLog";
import Notification from "@/models/Notification";
import Today from "./Today";
import Waiting from "./Waiting";

export default async function Page() {
  await db();
  const user = await getUser();
  const plan = await activePlan(user._id);
  const first = user.name.split(" ")[0];
  if (!plan) return <Waiting name={first} coach={coachName()} />;

  const date = istDate();
  const dayIdx = weekdayIndex();
  const [log, st, note] = await Promise.all([
    DailyLog.findOne({ user: user._id, date }).lean(),
    streak(user._id),
    Notification.findOne({ user: user._id, kind: { $in: ["coach", "plan"] } }).sort({ createdAt: -1 }).lean(),
  ]);
  const session = plan.workout?.sessions?.find((s) => s.day === plan.diet[dayIdx].day) || null;
  const week = workoutWeek(plan);

  return (
    <Today
      name={first}
      coach={coachName()}
      date={date}
      day={plain(plan.diet[dayIdx])}
      targets={plan.targets}
      log={plain(log || { meals: {}, swaps: {}, waterMl: 0, steps: 0 })}
      streak={st}
      session={plain(session)}
      prog={plan.workout?.progression?.[week - 1]}
      note={note ? { title: note.title, body: note.body } : null}
    />
  );
}
