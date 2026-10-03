import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { plain } from "@/lib/userData";
import { weightSeries } from "@/lib/adapt";
import CheckIn from "@/models/CheckIn";
import Photo from "@/models/Photo";
import Progress from "./Progress";

export default async function Page() {
  await db();
  const user = await getUser();
  const [checkins, series, photos] = await Promise.all([
    CheckIn.find({ user: user._id }).sort({ date: 1 }).lean(),
    weightSeries(user._id, 365),
    Photo.find({ user: user._id }).sort({ createdAt: 1 }).limit(60).lean(),
  ]);
  return (
    <Progress
      start={{ weightKg: user.startWeightKg, date: user.createdAt.toISOString().slice(0, 10) }}
      goal={user.profile?.targetWeightKg}
      checkins={plain(checkins)}
      series={series}
      photos={plain(photos)}
    />
  );
}
