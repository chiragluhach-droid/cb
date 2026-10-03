import mongoose from "mongoose";

const Mixed = mongoose.Schema.Types.Mixed;

const PlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    version: { type: Number, default: 1 },
    // drafting → review (admin queue) → active → archived
    status: { type: String, enum: ["drafting", "review", "active", "archived"], default: "review", index: true },
    source: { type: String, enum: ["ai", "engine", "manual"], default: "engine" },
    reason: { type: String, enum: ["initial", "progress_adjust", "plateau", "stage_change", "manual"], default: "initial" },
    stage: String,
    baseWeightKg: Number,
    calorieAdjust: { type: Number, default: 0 },
    seed: { type: Number, default: 0 },
    targets: Mixed,
    diet: Mixed, // [{ day, meals: [{ slot, time, name, items[], kcal, protein, carbs, fat, swaps[] }] }]
    workout: Mixed,
    coachNote: String,
    adminNote: String, // internal only
    activatedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
