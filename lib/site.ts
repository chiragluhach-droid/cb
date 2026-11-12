export const SITE_URL = "https://evowellnutrition.com";

export const site = {
  name: "Evowell",
  title: "Evowell — nutrition coaching built on Indian home food",
  description:
    "A personal diet and workout plan built around the Indian food you already eat. Made and reviewed by your coach, updated as your body changes.",
};

/**
 * Instagram handle, e.g. "@evowellnutrition". Left empty until the real one
 * is confirmed — the feed section shows "coming soon" without a link until then.
 */
export const instagramHandle: string = "";

export const nav = [
  { label: "How it works", href: "#how" },
  { label: "Sample day", href: "#sample" },
  { label: "Food", href: "#food" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

/** Unsplash photo URL helper. */
export const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const photos = {
  rotiSabzi: "1576846806147-8065a16f89b0",
  thali: "1711153419402-336ee48f2138",
  idliCoffee: "1741376509187-0b683c764294",
  idliLeaf: "1741376509047-66dae5df90f9",
  dosa: "1694849789325-914b71ab4075",
  masalaDosa: "1668236543090-82eba5ee5976",
  paneerTikka: "1781332146569-9c5093bc2ca5",
  khichdi: "1630409349416-24884761a307",
  chickenCurry: "1742599361539-f096753d1100",
  sabziPot: "1596797038530-2c107229654b",
  spices: "1596040033229-a9821ebd058d",
  palakPaneer: "1589647363585-f4a7d3877b10",
  chanaDal: "1705845580041-f04ad853617f",
  run: "1758922769578-68c5ba000d87",
  // How it works
  phoneSofa: "1758876023053-3aa541a0935b",
  mealPrep: "1543352632-5a4b24e4d2a6",
  videoCall: "1758691462749-a95ce1bd7f96",
  scale: "1522844990619-4951c40f7eda",
};
