import { db } from "@/lib/db";
import Coupon from "@/models/Coupon";
import { plain } from "@/lib/userData";
import Coupons from "./Coupons";

export default async function Page() {
  await db();
  const list = await Coupon.find().sort({ createdAt: -1 }).lean();
  return <Coupons list={plain(list)} />;
}
