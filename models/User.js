import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    sex: { type: String, enum: ["female", "male"] },
    age: Number,
    heightCm: Number,
    weightKg: Number,
    targetWeightKg: Number,
    goal: { type: String, enum: ["fat_loss", "muscle_gain", "recomp", "maintain"] },
    afterGoal: { type: String, enum: ["maintain", "build"], default: "maintain" },
    activity: { type: String, enum: ["sedentary", "light", "moderate", "active"], default: "light" },
    diet: { type: String, enum: ["vegan", "veg", "jain", "egg", "nonveg"], default: "veg" },
    conditions: [String],
    likes: [String],
    dislikes: [String],
    notes: String,
    mealsPerDay: { type: Number, default: 4 },
    workoutPlace: { type: String, enum: ["home", "gym"], default: "home" },
    experience: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    daysPerWeek: { type: Number, default: 4 },
    city: String,
    phone: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profile: { type: ProfileSchema, default: {} },
    onboarded: { type: Boolean, default: false },
    startWeightKg: Number,
    stage: { type: String, enum: ["fat_loss", "recomp", "maintain", "build"], default: "fat_loss" },
    subscription: {
      plan: { type: String, enum: ["30", "90", null], default: null },
      status: { type: String, enum: ["none", "active", "expired"], default: "none" },
      startsAt: Date,
      endsAt: Date,
    },
    lastLogAt: Date,
    lastReminderAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
