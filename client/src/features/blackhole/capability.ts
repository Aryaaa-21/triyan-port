/**
 * Decides whether the cosmic layer may run, and at what density. The site is
 * complete without it: every "no" here leaves the static CSS backdrop in place.
 */
export type CosmosTier = 'off' | 'low' | 'high';

interface Env {
  reducedMotion: boolean;
  saveData: boolean;
  webgl: boolean;
  cores: number;
  memoryGb: number | undefined;
  width: number;
  coarsePointer: boolean;
}

export const decideTier = (env: Env): CosmosTier => {
  if (env.reducedMotion || env.saveData || !env.webgl) return 'off';
  if ((env.memoryGb !== undefined && env.memoryGb < 2) || env.cores < 2) return 'off';
  if (env.width < 768 || env.coarsePointer || env.cores <= 4) return 'low';
  return 'high';
};

export const STAR_COUNT: Record<Exclude<CosmosTier, 'off'>, { stars: number; dust: number }> = {
  low: { stars: 700, dust: 60 },
  high: { stars: 2400, dust: 180 },
};

export const hasWebGL = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

export const readEnv = (): Env => {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(nav.connection?.saveData),
    webgl: hasWebGL(),
    cores: nav.hardwareConcurrency || 4,
    memoryGb: nav.deviceMemory,
    width: window.innerWidth,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  };
};
