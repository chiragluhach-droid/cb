const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };

export function bmr({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "female" ? base - 161 : base + 5;
}

export function tdee(p) {
  return bmr(p) * (ACTIVITY[p.activity] || 1.375);
}

// Daily targets for a given stage. `adjust` lets the adaptive engine nudge calories.
export function computeTargets(p, stage = p.goal, adjust = 0) {
  const maintenance = tdee(p);
  let kcal = maintenance;
  if (stage === "fat_loss") kcal = maintenance * 0.8;
  else if (stage === "recomp") kcal = maintenance * 0.9;
  else if (stage === "muscle_gain" || stage === "build") kcal = maintenance * 1.1;
  kcal += adjust;

  const floor = p.sex === "female" ? 1200 : 1500;
  kcal = Math.max(floor, Math.round(kcal / 10) * 10);

  // Protein on a sensible reference weight so heavier folks don't get 250g targets
  const refWeight = p.targetWeightKg && p.weightKg > p.targetWeightKg ? (p.weightKg + p.targetWeightKg) / 2 : p.weightKg;
  const perKg = stage === "fat_loss" || stage === "recomp" ? 1.6 : stage === "maintain" ? 1.5 : 1.8;
  const protein = Math.round(Math.min(refWeight * perKg, 200));

  const lowCarb = (p.conditions || []).some((c) => c === "pcos" || c === "diabetes");
  const fatPct = lowCarb ? 0.3 : 0.25;
  const fat = Math.round((kcal * fatPct) / 9);
  let carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
  if (lowCarb) carbs = Math.min(carbs, Math.round((kcal * 0.4) / 4));

  return {
    calories: kcal,
    protein,
    carbs: Math.max(carbs, 50),
    fat,
    water: Math.round((p.weightKg * 35) / 250) * 250,
    steps: stage === "fat_loss" ? 9000 : stage === "maintain" ? 8000 : 7500,
    maintenance: Math.round(maintenance),
  };
}

export const round1 = (n) => Math.round(n * 10) / 10;
