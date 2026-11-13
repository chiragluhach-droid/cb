/*
 * Business details shown on the policy pages (Terms, Privacy, Refunds,
 * Shipping & delivery, Contact). Razorpay checks these pages when it reviews
 * the website, so fill in every empty field before asking it to re-scan.
 * Empty fields are simply left off the pages.
 */

export const business = {
  /** Brand name customers see. */
  brand: "Evowell Nutrition & Training",
  /** Registered / legal name exactly as on your Razorpay account (person or company). */
  legalName: "JANSQUARE Private Limited",
  /** Full postal address, one line. */
  address: "5G-52, NIT, Block G, NIT 3 Main Road, Faridabad, Haryana 121001, India",
  /** City for "courts of …" in the Terms. */
  city: "Faridabad",
  /** Support email customers can write to. */
  email: "simonekathuriaa@gmail.com",
  /** Support phone / WhatsApp, e.g. "+91 98765 43210". */
  phone: "+91 97117 11059",
  /** When you answer, e.g. "Mon–Sat, 10am–7pm IST". */
  hours: "Mon–Sat, 10am–7pm IST",
  /** Days after payment within which a full refund can be asked for. */
  refundWindowDays: 7,
  /** Last time the policies changed. */
  updated: "13 November 2026",
};
