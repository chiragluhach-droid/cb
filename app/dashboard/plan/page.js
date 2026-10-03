import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { activePlan, plain } from "@/lib/userData";
import { weekdayIndex } from "@/lib/dates";
import { coachName } from "@/lib/plans";
import PlanView from "./PlanView";

export default async function Page() {
  await db();
  const user = await getUser();
  const plan = await activePlan(user._id);
  if (!plan) redirect("/dashboard");
  return <PlanView plan={plain(plan)} today={weekdayIndex()} coach={coachName()} stage={user.stage} />;
}
