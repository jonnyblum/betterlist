/**
 * Default visible category pills per specialty.
 * These are used when a clinician has not set customCategories on their profile.
 * Values must match ProductCategory enum strings.
 */
export const SPECIALTY_DEFAULT_CATEGORIES: Record<string, string[]> = {
  "Dermatology":  ["COSMETIC", "SUPPLEMENTS", "DEVICES", "APPS"],
  "Dentistry":    ["DENTAL", "SUPPLEMENTS", "DEVICES", "APPS"],
  "Dental":       ["DENTAL", "SUPPLEMENTS", "DEVICES", "APPS"],
  "Primary Care": ["SUPPLEMENTS", "DEVICES", "APPS", "WEARABLES"],
  "Cardiology":   ["DEVICES", "SUPPLEMENTS", "WEARABLES", "APPS"],
  "OB/GYN":       ["SUPPLEMENTS", "DEVICES", "APPS"],
  "Orthopedics":  ["DEVICES", "SUPPLEMENTS", "APPS", "WEARABLES"],
};

/**
 * Returns the default category values for a specialty, or null if no defaults
 * are configured (meaning "show all").
 */
export function getDefaultCategories(specialty: string | null | undefined): string[] | null {
  if (!specialty) return null;
  return SPECIALTY_DEFAULT_CATEGORIES[specialty] ?? null;
}
