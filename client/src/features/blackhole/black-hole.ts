/**
 * The black hole, drawn by a single fragment shader: no library, no textures.
 *
 * Everything is measured in units of the shadow's radius. The shadow; a thin photon
 * ring inside it with a light travelling round it; the far side of the accretion
 * disk lensed into a dome; the near side as a broad brim; the band crossing in front;
 * the lensed underside as a smaller arc. Behind: a star field seen through the lens,
 * random sparkles and shooting stars. In front: glittering stars spiralling in and
 * vanishing at the shadow, and glints orbiting in the disk plane. Empty space is
 * exactly black. Black and white throughout: the disk runs from deep grey at its faint
 * edges through smoke and silver to white near the shadow, and every star is white.
 */
export const BLACK_HOLE_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScale;   // pixels per shadow radius
uniform float uZoom;    // 1 = rest; grows as the camera falls in (scroll)
uniform vec2 uOffset;   // where the hole sits, in shadow radii from the centre
uniform vec2 uPointer;  // -0.5..0.5, for parallax
uniform float uOverlay; // 1 = only the living layers, drawn over a photograph of the hole

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

/**
 * A sparse star field, sampled through the lens: q is where light from a star would
 * appear to come from. Two layers — many faint, a few bright — that twinkle slowly.
 * px is one screen pixel in these units, so stars stay pin-sharp at any size.
 */
float starField(vec2 q, float t, float px) {
  float s = 0.0;
  for (int l = 0; l < 3; l++) {
    float dens = l == 0 ? 6.5 : (l == 1 ? 2.6 : 1.05);
    float keep = l == 0 ? 0.55 : (l == 1 ? 0.84 : 0.9);
    vec2 g = q * dens;
    vec2 id = floor(g);
    float h = hash(id + float(l) * 17.3);
    if (h > keep) {
      vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) * 0.7 + 0.15;
      vec2 dv = (fract(g) - o) / dens;
      float d2 = dot(dv, dv);
      float size = px * (l == 0 ? 0.9 : (l == 1 ? 1.5 : 2.1));
      float twinkle = 0.55 + 0.45 * sin(t * (0.6 + h * 2.2) + h * 40.0);
      float b = (l == 0 ? 0.45 : (l == 1 ? 1.0 : 1.5)) * (0.5 + 0.5 * hash(id + 11.0)) * twinkle;
      float core = exp(-d2 / (size * size));
      float glow = l == 0 ? 0.0 : 0.07 * exp(-sqrt(d2) / (size * 3.0));
      // The brightest few carry faint four-point spikes, as in a long exposure.
      float spikes = 0.0;
      if (l == 2) {
        vec2 a = abs(dv);
        spikes = 0.35 * (exp(-a.x / (px * 0.7)) * exp(-a.y / (px * 16.0))
                       + exp(-a.y / (px * 0.7)) * exp(-a.x / (px * 16.0)));
      }
      s += b * (core + glow + spikes);
    }
  }
  return s;
}

/**
 * Shooting stars at irregular moments: three slots, each picking a fresh path, speed
 * and length every cycle — and sometimes nothing at all.
 */
float shootingStars(vec2 p, float t, float px) {
  float total = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float period = 4.1 + fi * 2.3;
    float cycle = floor((t + fi * 2.7) / period);
    float h0 = hash(vec2(cycle, fi * 5.0 + 1.0));
    if (h0 < 0.35) continue;                                  // a quiet cycle
    float window = mix(0.18, 0.34, hash(vec2(cycle, fi + 8.0)));
    float k = fract((t + fi * 2.7) / period) / window;
    if (k > 1.0) continue;
    float h1 = hash(vec2(cycle, fi * 13.0));
    float h2 = hash(vec2(cycle + 4.0, fi * 7.0));
    float side = hash(vec2(cycle, fi + 21.0)) > 0.5 ? 1.0 : -1.0;
    vec2 from = vec2(side * mix(-3.6, 0.6, h1), mix(1.0, 2.6, h2));
    vec2 dir = normalize(vec2(side, -mix(0.2, 0.8, h2)));
    float travel = mix(3.0, 5.2, h0);
    vec2 head = from + dir * k * travel;
    vec2 rel = p - head;
    float along = dot(rel, -dir);
    float across = abs(dot(rel, vec2(-dir.y, dir.x)));
    float len = mix(0.18, 0.4, h1);
    if (along < -px * 3.0 || along > len * 3.5) continue;
    float tail = exp(-max(along, 0.0) / len) * exp(-across / (px * 1.1));
    total += mix(0.8, 1.6, h2) * tail * sin(k * 3.14159);
  }
  return total;
}

/** Brief sparkles that pop at random points of the sky and fade. */
float glitterPops(vec2 q, float t, float px) {
  float dens = 1.4;
  vec2 g = q * dens;
  vec2 id = floor(g);
  float rate = 0.35 + hash(id + 2.0) * 0.5;
  float slot = floor(t * rate + hash(id) * 10.0);
  float h = hash(id + slot * 1.7);
  if (h < 0.93) return 0.0;                                   // most cells are dark, most of the time
  float k = fract(t * rate + hash(id) * 10.0);
  float env = pow(sin(k * 3.14159), 3.0);
  vec2 o = vec2(hash(id + slot + 5.0), hash(id + slot + 9.0)) * 0.7 + 0.15;
  vec2 dv = (fract(g) - o) / dens;
  vec2 a = abs(dv);
  float core = exp(-dot(dv, dv) / (px * px * 3.0));
  float spikes = 0.7 * (exp(-a.x / (px * 0.8)) * exp(-a.y / (px * 12.0))
                      + exp(-a.y / (px * 0.8)) * exp(-a.x / (px * 12.0)));
  return 1.3 * env * (core + spikes);
}

/**
 * Glittering stars falling in: each spirals toward the shadow from beyond the edge,
 * speeding up and stretching as it nears, sparkling all the way, and vanishing at
 * the edge of the dark.
 */
float infall(vec2 p, float t, float px) {
  float total = 0.0;
  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    float period = 4.5 + hash(vec2(fi, 1.0)) * 5.5;
    float cycle = floor((t + fi * 1.37) / period);
    float k = fract((t + fi * 1.37) / period);
    float seed = hash(vec2(fi, cycle));
    if (hash(vec2(cycle, fi + 40.0)) < 0.18) continue;            // some turns, it does not come
    float r0 = 2.8 + 1.6 * hash(vec2(cycle, fi + 3.0));
    float flat_ = mix(0.6, 1.0, hash(vec2(cycle, fi + 51.0)));    // how tilted its path is
    float bright = mix(0.6, 1.25, hash(vec2(cycle, fi + 63.0)));
    float a0 = seed * 6.2832;
    // Radius falls slowly, then fast; the angle winds up as the radius shrinks.
    float ease = k * k * (1.6 - 0.6 * k);
    float rad = mix(r0, 0.98, ease);
    float spin = (hash(vec2(fi, cycle + 9.0)) > 0.5 ? 1.0 : -1.0) * mix(1.1, 2.0, seed);
    float ang = a0 + spin * (1.0 / rad - 1.0 / r0) * 2.2;
    vec2 pos = rad * vec2(cos(ang), sin(ang) * flat_);
    // A short trail behind it, along the path.
    float k2 = max(k - (0.02 + 0.03 * k), 0.0);                 // longer trails as it nears
    float ease2 = k2 * k2 * (1.6 - 0.6 * k2);
    float rad2 = mix(r0, 0.98, ease2);
    float ang2 = a0 + spin * (1.0 / rad2 - 1.0 / r0) * 2.2;
    vec2 prev = rad2 * vec2(cos(ang2), sin(ang2) * flat_);
    vec2 seg = pos - prev;
    float segLen = max(length(seg), 1e-4);
    float h = clamp(dot(p - prev, seg) / (segLen * segLen), 0.0, 1.0);
    float d = length(p - (prev + seg * h));
    float trail = exp(-d / (px * 1.3)) * mix(0.2, 1.0, h);
    // Glitter: a fast, uneven sparkle, with brief four-point flashes.
    float glint = 0.6 + 0.4 * sin(t * (9.0 + fi) + fi * 3.1);
    vec2 a = abs(p - pos);
    float flash = pow(max(sin(t * (2.3 + fi * 0.2) + fi), 0.0), 6.0);
    float spikes = flash * 0.85 * (exp(-a.x / (px * 0.8)) * exp(-a.y / (px * 13.0))
                                 + exp(-a.y / (px * 0.8)) * exp(-a.x / (px * 13.0)));
    float core = exp(-dot(p - pos, p - pos) / (px * px * 4.0));
    float halo = 0.12 * exp(-length(p - pos) / (px * 5.0));
    float life = smoothstep(0.0, 0.12, k) * smoothstep(1.0, 1.25, rad);   // swallowed at the edge
    total += (1.3 * core * glint + halo * glint + 0.7 * trail + spikes) * life * bright;
  }
  return total;
}

/** Small glints orbiting in the disk plane: in front of the shadow, or hidden behind it. */
float orbiters(vec2 p, float t, float px) {
  float total = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float rx = 1.35 + fi * 0.28;
    float ang = t * (0.55 - fi * 0.06) + fi * 1.9;
    vec2 pos = vec2(rx * cos(ang), -0.06 + rx * 0.16 * sin(ang));
    bool behind = sin(ang) > 0.0;
    if (behind && length(pos) < 1.02) continue;
    float core = exp(-dot(p - pos, p - pos) / (px * px * 3.0));
    total += core * (behind ? 0.45 : 1.0);
  }
  return total;
}

/**
 * The disk in black and white: its brightness mapped from deep grey at the faint edges,
 * through smoke and silver, to white closest to the shadow — the tones of the
 * black-and-white front-page image.
 */
vec3 diskColour(float v) {
  vec3 shadow = vec3(0.38);
  vec3 smoke = vec3(0.64);
  vec3 silver = vec3(0.83);
  vec3 white = vec3(0.97);
  vec3 c = mix(shadow, smoke, smoothstep(0.0, 0.35, v));
  c = mix(c, silver, smoothstep(0.3, 0.6, v));
  c = mix(c, white, smoothstep(0.6, 0.9, v));
  return c * min(1.0, v * 1.6);
}

/**
 * Over the photograph: only the living layers. Lensed stars twinkle and drift, sparkles
 * pop, shooting stars cross, glittering stars fall in and vanish at the shadow, glints
 * orbit in the disk plane, a light runs round the shadow's rim, and now and then a flare
 * sweeps along the disk. Drawn on black and screen-blended, so it only ever adds light.
 */
vec3 overlayLayers(vec2 p, float r, float t) {
  float px = 1.0 / (uScale * uZoom);
  float sky = 0.0;
  if (r > 1.0) {
    float thetaE = 1.2;
    vec2 q = p - p * (thetaE * thetaE) / (r * r);
    q += vec2(0.018 * t, 0.004 * t) - uPointer * 0.25;
    float S = uScale / 170.0;
    // The photograph has its own stars, so the added field is lighter.
    sky = 0.7 * starField(q * S, t, px * S) + glitterPops(q * S, t, px * S) + shootingStars(p, t, px);
    sky *= smoothstep(1.0, 1.08, r);
  }
  float glitter = infall(p, t, px) + orbiters(p, t, px);

  // A light running round the rim of the shadow — which in the photograph is a touch
  // wider than tall — over the upper edge only, where no disk passes in front of it.
  vec2 e = vec2(p.x / 1.016, p.y / 0.945);
  float ang = atan(e.y, e.x);
  float lap = mod(ang - t * 0.55 + 3.14159, 6.28318) - 3.14159;
  float rim = exp(-pow((length(e) - 1.03) / 0.02, 2.0)) * 0.9 * exp(-lap * lap / 0.06)
            * smoothstep(-0.12, 0.08, e.y);

  // Now and then a flare sweeps along the disk, which lies just below the centre.
  float flare = 0.0;
  float cycle = floor(t / 4.3);
  if (hash(vec2(cycle, 91.0)) > 0.45) {
    float k = fract(t / 4.3);
    float front = mix(-4.5, 4.5, k);
    flare = 0.3 * sin(k * 3.14159)
          * exp(-pow((p.x - front) / 0.6, 2.0) - pow((p.y + 0.22) / 0.14, 2.0));
  }

  vec3 col = vec3(0.92) * (1.0 - exp(-sky * 1.45))
           + vec3(1.0) * (1.0 - exp(-glitter * 1.45))
           + vec3(0.95) * (rim + flare);
  float m = max(col.r, max(col.g, col.b));
  col *= smoothstep(0.012, 0.03, m);
  return min(col, vec3(1.0));
}

void main() {
  float t = uTime;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (uScale * uZoom);
  // The camera breathes: a slow drift and roll, and a touch of pointer parallax.
  // Over a photograph the hole cannot move, so neither does the camera.
  float moving = 1.0 - uOverlay;
  p -= uOffset + (vec2(sin(t * 0.11), cos(t * 0.09)) * 0.025 + uPointer * 0.05) * moving;
  float roll = 0.012 * sin(t * 0.13) * moving;
  p = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * p;
  float r = length(p);
  if (uOverlay > 0.5) {
    gl_FragColor = vec4(overlayLayers(p, r, t), 1.0);
    return;
  }
  float ax = abs(p.x);

  // ---- geometry, in units of the shadow radius ------------------------------
  // Outer edge of the lensed arch, plus the thickness the wings keep far out.
  float tip = 1.0 - smoothstep(2.15, 2.7, ax);                    // the brim's rounded ends
  float dome = 1.36 * exp(-pow(ax / 1.6, 3.0));
  float brim = 0.25 * sqrt(max(tip, 0.0));
  // A dome on a broad brim: the lensed far side, and the disk seen nearly edge-on.
  float yTop = max(dome, brim) + 0.04 * smoothstep(1.5, 1.9, ax) * tip;
  float wingMid = -0.025;
  float yb = -(0.1 + 0.25 * exp(-max(ax - 1.0, 0.0) / 1.3)) * sqrt(max(tip, 0.0)); // lower edge
  float frontY = -0.29;                                          // the band crossing in front
  float reach = (1.0 - smoothstep(2.15, 2.75, ax)) * mix(1.0, 0.62, smoothstep(1.1, 2.6, ax)); // fading outward

  float outside = smoothstep(0.995, 1.012, r);                   // the shadow's hard edge
  float I = 0.0;

  // ---- the disk outside the shadow: the arch above, the wings beside ----------
  float upper = 0.0;
  {
    // Distance from the inner boundary: the shadow above it, the disk plane beside it.
    float dIn = min(max(r - 1.0, 0.0), max(p.y - wingMid, 0.0));
    float dOut = max(yTop - p.y, 0.0);
    float su = dIn / max(dIn + dOut, 1e-4);
    // Feathered, slowly turbulent outer edge — contained inside the arch.
    float wobble = (fbm(vec2(p.x * 2.2 - t * 0.12, p.y * 1.5)) - 0.5) * 0.16;
    float body = mix(1.0, 0.5, su) * (1.0 - smoothstep(0.82 + wobble, 0.995, su));
    body *= step(p.y, yTop);
    float contour = (p.y - wingMid) / max(yTop - wingMid, 1e-3);   // follows the arch's curve
    float streak = 0.5 + 0.5 * fbm(vec2(contour * 11.0, p.x * 0.45 - t * 0.18));
    streak *= 0.8 + 0.2 * noise(vec2(contour * 46.0, p.x * 1.2 - t * 0.3));
    float lift = mix(0.85, 1.0, exp(-max(ax - 1.0, 0.0) * 0.6));  // brighter near the hole
    upper = 0.82 * body * streak * lift * mix(reach, 1.0, step(ax, 1.05));
  }
  float lower = 0.0;
  {
    float sl = max(wingMid - p.y, 0.0) / max(wingMid - yb, 1e-3);
    sl += (fbm(vec2(p.x * 2.6 + t * 0.1, 3.0)) - 0.5) * 0.3 * smoothstep(0.0, 0.3, sl);
    float body = mix(1.0, 0.55, clamp(sl, 0.0, 1.0)) * (1.0 - smoothstep(0.7, 1.05, sl));
    float streak = 0.55 + 0.45 * fbm(vec2(sl * 9.0, p.x * 0.6 + t * 0.26));
    float beside = smoothstep(0.92, 1.12, ax);                    // nothing in front of the shadow
    lower = 0.85 * body * streak * reach * beside;
  }
  // Blend across the disk plane so the two halves meet without a seam.
  I += mix(lower, upper, smoothstep(wingMid - 0.05, wingMid + 0.05, p.y)) * outside;

  // ---- the lensed underside: a smaller arc beneath the shadow -------------------
  {
    float band = smoothstep(1.0, 1.03, r) * (1.0 - smoothstep(1.19, 1.26, r));
    float below = smoothstep(frontY + 0.02, frontY - 0.06, p.y);   // soft where it meets the band
    float streak = 0.62 + 0.38 * fbm(vec2(r * 20.0, atan(p.y, p.x) * 2.4 + t * 0.2));
    float sides = 1.0 - smoothstep(1.0, 1.2, ax);
    I += 0.62 * band * below * streak * sides;
  }

  // ---- inside the shadow: black, but for the photon ring ------------------------
  if (r < 1.0) {
    float ang = atan(p.y, p.x);
    float shimmer = 0.9 + 0.1 * sin(ang * 3.0 + t * 1.3);
    // A bright point travelling around the ring.
    float lap = mod(ang - t * 0.9 + 3.14159, 6.28318) - 3.14159;
    shimmer += 0.9 * exp(-lap * lap / 0.05);
    I += (exp(-pow((r - 0.855) / 0.0055, 2.0)) * 1.15
        + 0.1 * exp(-pow((r - 0.855) / 0.035, 2.0))) * shimmer;
    I += 0.05 * exp(-pow((r - 0.985) / 0.018, 2.0));
  }

  // ---- the band crossing in front of the shadow ---------------------------------
  float crossing = exp(-pow((p.y - frontY) / 0.03, 2.0));
  float crossStreak = 0.75 + 0.25 * noise(vec2(p.x * 9.0 - t * 0.5, 1.0));
  I += 0.6 * crossing * crossStreak * (1.0 - smoothstep(0.96, 1.12, ax));
  // where the band meets the wings, the light gathers
  I += 0.42 * exp(-pow((ax - 1.05) / 0.09, 2.0) - pow((p.y + 0.2) / 0.11, 2.0));

  // The disk breathes, slowly — and now and then a flare runs through it.
  I *= 0.95 + 0.05 * sin(t * 0.6);
  float flareCycle = floor(t / 3.7);
  if (hash(vec2(flareCycle, 77.0)) > 0.62) {
    float fk = fract(t / 3.7);
    float front = fk * 6.0 - 3.0;                              // sweeps left to right
    I *= 1.0 + 0.35 * exp(-pow((p.x - front) / 0.35, 2.0)) * sin(fk * 3.14159);
  }

  // ---- stars behind it all, bent around the hole -------------------------------
  // Point-lens approximation: light passing near the hole is deflected, so stars close
  // to the shadow are pulled into arcs along the Einstein ring.
  float px = 1.0 / (uScale * uZoom);
  float sky = 0.0;
  if (r > 1.0) {
    float thetaE = 1.2;
    vec2 q = p - p * (thetaE * thetaE) / (r * r);
    q += vec2(0.018 * t, 0.004 * t) - uPointer * 0.25;    // drift, and parallax (stars are far)
    // Star density is set in screen terms (one shadow radius ~170px), so a phone and a
    // desktop see the same sky; it still scales with the fall, so stars stream outward.
    float S = uScale / 170.0;
    sky = starField(q * S, t, px * S) + glitterPops(q * S, t, px * S) + shootingStars(p, t, px);
    // The disk is in front: where it glows, the stars are hidden.
    sky *= (1.0 - clamp(I * 3.0, 0.0, 1.0)) * smoothstep(1.0, 1.08, r);
  }

  // ---- a faint halo, so the light reads as light ------------------------------
  float halo = exp(-max(r - 1.0, 0.0) * 2.4) * smoothstep(0.98, 1.05, r);
  I += 0.025 * halo * (p.y > wingMid ? 1.0 : 0.5) * step(r, 2.2);

  // ---- in front: glittering stars falling in, and glints orbiting ---------------
  float glitter = infall(p, t, px) + orbiters(p, t, px);

  // Gentle Doppler asymmetry: the approaching side a touch brighter.
  I *= 1.0 - 0.06 * clamp(p.x / 2.5, -1.0, 1.0);

  // The disk in greys; the stars, and the stars falling in, white. Each layer gets the
  // same soft highlight roll-off.
  vec3 col = diskColour(1.0 - exp(-I * 1.6))
           + vec3(0.92) * (1.0 - exp(-sky * 1.45))
           + vec3(1.0) * (1.0 - exp(-glitter * 1.45));
  // A black toe: the faint tails of glows and spikes are crushed to exactly zero.
  float m = max(col.r, max(col.g, col.b));
  col *= smoothstep(0.012, 0.03, m);
  // Dither only where there is light, against banding in the disk.
  col += (hash(gl_FragCoord.xy + t) - 0.5) / 255.0 * step(0.03, m);
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}
`;

const VERTEX = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

export interface BlackHoleOptions {
  /** Shadow radius as a fraction of the canvas's shorter side. */
  radius: number;
  /** ...but never smaller than this, in CSS pixels (so text can sit inside it). */
  minRadiusPx: number;
  /** Where the hole sits, in shadow radii from the centre (+y is up). */
  offset: [number, number];
  /** Device-pixel-ratio cap: lower on modest devices. */
  dprCap: number;
  /**
   * Drawing over a photograph instead: its natural size and the shadow's radius in it,
   * all in image pixels. The photo is shown with object-fit: cover, centred on the hole;
   * only the living layers are drawn, and the hole's size follows the photo's.
   */
  cover?: CoverImage;
  onFirstFrame?: () => void;
}

export interface BlackHole {
  start(): void;
  stop(): void;
  /** Draws one still frame — for reduced motion. */
  still(time: number): void;
  setZoom(zoom: number): void;
  setPointer(x: number, y: number): void;
  dispose(): void;
}

/** A photograph of the hole drawn beneath the effects, in its own pixels. */
export interface CoverImage {
  width: number;
  height: number;
  /** The shadow's radius. */
  radius: number;
  /**
   * How much of the image's width must stay on screen. On tall screens a plain cover
   * crop would cut the disk off; the image is shown at least this wide instead.
   */
  visibleWidth?: number;
}

/**
 * The photo's scale on screen: a cover fit, except on tall screens, where it is only
 * as large as keeps `visibleWidth` in view (the CSS in globals.css mirrors this).
 */
export const coverScale = (cw: number, ch: number, cover: CoverImage): number =>
  Math.max(cw / cover.width, Math.min(ch / cover.height, cw / (cover.visibleWidth ?? cover.width)));

/** The drawn disk reaches about 2.7 shadow radii either side: keep it all on screen. */
const DISK_HALF_SPAN = 2.85;

/** The drawn hole's radius in CSS px: a share of the shorter side, within the width. */
export const drawnRadius = (cw: number, ch: number, radius: number, minRadiusPx: number) =>
  Math.min(Math.max(radius * Math.min(cw, ch), minRadiusPx), cw / (2 * DISK_HALF_SPAN));

/** Returns null when WebGL is unavailable, so the caller can fall back. */
export const createBlackHole = (
  canvas: HTMLCanvasElement,
  options: BlackHoleOptions,
): BlackHole | null => {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, BLACK_HOLE_FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One oversized triangle covers the canvas.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uRes = u('uRes');
  const uTime = u('uTime');
  const uScale = u('uScale');
  const uZoom = u('uZoom');
  const uOffset = u('uOffset');
  const uPointer = u('uPointer');
  const uOverlay = u('uOverlay');

  let zoom = 1;
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let raf = 0;
  let running = false;
  let first = true;
  let dpr = 1;
  const born = performance.now();

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, options.dprCap);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const draw = (seconds: number) => {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const { cover } = options;
    const radiusCss = cover
      ? cover.radius * coverScale(cw, ch, cover)
      : drawnRadius(cw, ch, options.radius, options.minRadiusPx);
    // Pointer parallax eases toward its target rather than snapping.
    sx += (px - sx) * 0.06;
    sy += (py - sy) * 0.06;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, seconds);
    gl.uniform1f(uScale, radiusCss * dpr);
    gl.uniform1f(uZoom, zoom);
    gl.uniform2f(uOffset, options.offset[0], options.offset[1]);
    gl.uniform2f(uPointer, sx, sy);
    gl.uniform1f(uOverlay, cover ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (first) {
      first = false;
      options.onFirstFrame?.();
    }
  };

  const loop = (now: number) => {
    if (!running) return;
    draw((now - born) / 1000);
    raf = requestAnimationFrame(loop);
  };

  return {
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    still(time) {
      draw(time);
    },
    setZoom(z) {
      zoom = z;
    },
    setPointer(x, y) {
      px = x;
      py = y;
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Not loseContext(): React may set the same canvas up again in development.
    },
  };
};
