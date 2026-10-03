// Daily sweep: nudges for users who stopped logging, weekly check-in reminders,
// renewal reminders and expiry. Hit /api/cron/reminders once a day.
import User from "@/models/User";
import Alert from "@/models/Alert";
import Notification from "@/models/Notification";
import CheckIn from "@/models/CheckIn";
import { coachName } from "./plans";
import { istDate, daysBetween } from "./dates";

async function once(userId, type, message) {
  const exists = await Alert.findOne({ user: userId, type, resolved: false });
  if (!exists) await Alert.create({ user: userId, type, message });
}

export async function runReminders() {
  const now = new Date();
  const today = istDate(now);
  const users = await User.find({ role: "user", "subscription.status": "active" });
  const stats = { nudged: 0, checkin: 0, renewal: 0, expired: 0 };
  const coach = coachName();

  for (const u of users) {
    const first = u.name.split(" ")[0];
    const ends = u.subscription.endsAt;

    if (ends && ends < now) {
      u.subscription.status = "expired";
      await u.save();
      await Notification.create({ user: u._id, kind: "renewal", title: "Your plan has ended", body: `${first}, your plan has ended. Renew to keep your progress going. I'll be here. — ${coach}` });
      await once(u._id, "renewal", "Subscription expired");
      stats.expired++;
      continue;
    }

    const recentlyReminded = u.lastReminderAt && daysBetween(istDate(u.lastReminderAt), today) < 1;
    if (recentlyReminded) continue;
    let sent = false;

    // Stopped logging
    const quietDays = u.lastLogAt ? daysBetween(istDate(u.lastLogAt), today) : 99;
    if (quietDays >= 2) {
      await Notification.create({
        user: u._id,
        kind: "nudge",
        title: quietDays >= 5 ? "Hey, I miss your logs 👀" : "Quick check-in?",
        body: quietDays >= 5
          ? `${first}, it's been ${quietDays} days. No guilt, just tick off today's first meal and we're back on track. — ${coach}`
          : `${first}, no log from you in ${quietDays} days. Takes 20 seconds. — ${coach}`,
      });
      if (quietDays >= 4) await once(u._id, "inactive", `No logs for ${quietDays} days`);
      stats.nudged++;
      sent = true;
    }

    // Weekly check-in
    const last = await CheckIn.findOne({ user: u._id }).sort({ date: -1 });
    if (!sent && (!last || daysBetween(last.date, today) >= 7)) {
      await Notification.create({ user: u._id, kind: "checkin", title: "Weekly check-in day 📏", body: `Weight, waist and a quick photo, ${first}. I use these to tune your plan. — ${coach}` });
      stats.checkin++;
      sent = true;
    }

    // Renewal (5 days and 1 day before)
    const left = ends ? daysBetween(today, istDate(ends)) : null;
    if (left === 5 || left === 1) {
      await Notification.create({ user: u._id, kind: "renewal", title: `${left} day${left > 1 ? "s" : ""} left on your plan`, body: `Renew now so your plan doesn't pause. Your next phase is already mapped out. — ${coach}` });
      await once(u._id, "renewal", `Plan ends in ${left} day(s)`);
      stats.renewal++;
      sent = true;
    }

    if (sent) {
      u.lastReminderAt = now;
      await u.save();
    }
  }
  return stats;
}
