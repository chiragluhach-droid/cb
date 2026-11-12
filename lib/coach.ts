/** Demo coach replies, picked by keyword. Real replies will come from the coach. */
export function coachReply(text: string, name: string) {
  const t = text.toLowerCase();
  const first = name.split(" ")[0];
  if (/swap|change|replace|don'?t like|bored/.test(t))
    return "Sure — use the swap button on any meal in Today and pick something with similar protein. If none work, tell me what you'd rather eat and I'll add it.";
  if (/plateau|stuck|not losing|same weight|scale/.test(t))
    return `That's normal, ${first}. Give it one more week at your current plan, keep steps up, and log your weight daily. If it still hasn't moved, I'll adjust your calories.`;
  if (/wedding|party|travel|trip|weekend|eating out|restaurant/.test(t))
    return "Enjoy it! Have a protein-heavy meal earlier in the day, go easy on fried starters and sweets, and walk after. We'll get straight back on track the next day.";
  if (/water|thirst/.test(t)) return "Aim for 8 glasses — more on workout days. A glass with every meal makes it easy.";
  if (/sore|pain|injur|hurt/.test(t)) return "Mild soreness is fine, sharp pain isn't. Skip anything that hurts and tell me which exercise — I'll swap it. If pain persists, please see a doctor.";
  if (/hungry|craving|sweet|chai/.test(t)) return "Try roasted chana or makhana between meals, and have your chai with lunch instead of on an empty stomach. Hunger usually settles in a week or two.";
  return `Thanks ${first}, noted! I'll look at this and update your plan if needed — usually the same day.`;
}
