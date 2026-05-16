export type UnitSystem = 'metric' | 'imperial';

const KG_TO_LB = 2.20462262;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/**
 * Format a weight stored internally in kg according to the user's unit system.
 *  - metric → "{rounded} kg"
 *  - imperial → "{rounded} lbs"
 *
 * Storage is always kg. Only display switches.
 */
export function formatWeight(kg: number, system: UnitSystem = 'metric', opts?: { digits?: number; unit?: boolean }): string {
  const digits = opts?.digits ?? (kg % 1 === 0 ? 0 : 1);
  const includeUnit = opts?.unit ?? true;
  const value = system === 'imperial' ? kgToLb(kg) : kg;
  const rounded = value.toFixed(digits);
  if (!includeUnit) return rounded;
  return `${rounded} ${system === 'imperial' ? 'lbs' : 'kg'}`;
}

/** Returns the unit suffix ("kg" or "lbs") for a given system. */
export function unitLabel(system: UnitSystem = 'metric'): string {
  return system === 'imperial' ? 'lbs' : 'kg';
}
