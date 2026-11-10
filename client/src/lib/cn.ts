type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Minimal class joiner. Deliberately not a dependency: it is six lines, and the
 * performance budget (§12) is easier to hold when the utility layer is this small.
 */
export const cn = (...values: ClassValue[]): string => {
  const out: string[] = [];
  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(' ');
};
