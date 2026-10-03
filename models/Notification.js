import mongoose from "mongoose";

// User-facing messages from their coach
const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    kind: { type: String, enum: ["nudge", "checkin", "renewal", "plan", "coach"], default: "coach" },
    title: String,
    body: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
