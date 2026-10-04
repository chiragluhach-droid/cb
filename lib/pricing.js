export const PLANS = {
  "30": { id: "30", label: "Starter", days: 30, INR: 1999, USD: 29, perks: ["Personal diet + workout plan", "Daily tracking dashboard", "Weekly check-ins with your coach", "1 plan update"] },
  "90": { id: "90", label: "Transformation", days: 90, INR: 4999, USD: 69, perks: ["Everything in Starter", "Plan updates whenever your body changes", "Plateau-breaker adjustments", "Goal-stage switch (cut → maintain → build)", "Before / after progress report"] },
};

export function applyCoupon(price, coupon, currency) {
  if (!coupon) return { final: price, discount: 0 };
  let discount = Math.round((price * (coupon.percentOff || 0)) / 100);
  // flat discounts are stored in INR; convert roughly for USD
  if (coupon.flatOff) discount += currency === "USD" ? Math.round(coupon.flatOff / 85) : coupon.flatOff;
  discount = Math.min(discount, price - 1);
  return { final: price - discount, discount };
}

export function couponValid(c) {
  if (!c || !c.active) return false;
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
  if (c.maxUses && c.uses >= c.maxUses) return false;
  return true;
}
