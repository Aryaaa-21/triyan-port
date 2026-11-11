/**
 * The black hole, drawn by a single fragment shader: no library, no textures.
 *
 * Everything is measured in units of the shadow's radius. The pieces, as in the
 * reference image: the shadow; a thin photon ring inside it; the far side of the
 * accretion disk, lensed into a dome over the top; the near side, seen almost
 * edge-on as a broad brim; the band of the disk crossing in front; and the lensed
 * underside as a smaller arc below. Behind it, a star field seen through the lens —
 * stars near the hole are pulled into arcs — with one shooting star early on. Empty
 * space is exactly black. Monochrome, and slowly turning.
 */
export const BLACK_HOLE_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScale;   // pixels per shadow radius
uniform float uZoom;    // 1 = rest; grows as the camera falls in

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

/** One shooting star, early in the intro: a short bright head and a fading tail. */
float shootingStar(vec2 p, float t, float px) {
  float k = (t - 0.9) / 1.1;                                // crosses between 0.9s and 2.0s
  if (k < 0.0 || k > 1.0) return 0.0;
  vec2 from = vec2(-2.6, 2.3);
  vec2 dir = normalize(vec2(1.0, -0.42));
  vec2 head = from + dir * k * 4.2;
  vec2 rel = p - head;
  float along = dot(rel, -dir);                             // distance back along the tail
  float across = abs(dot(rel, vec2(-dir.y, dir.x)));
  if (along < -px * 3.0 || along > 0.9) return 0.0;
  float tail = exp(-max(along, 0.0) / 0.28) * exp(-across / (px * 1.1));
  float fade = sin(k * 3.14159);                            // in, and out again
  return 1.4 * tail * fade;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (uScale * uZoom);
  float t = uTime;
  float r = length(p);
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
    float shimmer = 0.9 + 0.1 * sin(atan(p.y, p.x) * 3.0 + t * 1.3);
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

  // ---- stars behind it all, bent around the hole -------------------------------
  // Point-lens approximation: light passing near the hole is deflected, so stars close
  // to the shadow are pulled into arcs along the Einstein ring.
  float px = 1.0 / (uScale * uZoom);
  if (r > 1.0) {
    float thetaE = 1.2;
    vec2 q = p - p * (thetaE * thetaE) / (r * r);
    q += vec2(0.018 * t, 0.004 * t);                       // a slow drift across the sky
    // Star density is set in screen terms (one shadow radius ~170px), so a phone and a
    // desktop see the same sky; it still scales with the fall, so stars stream outward.
    float S = uScale / 170.0;
    float sky = starField(q * S, t, px * S) + shootingStar(p, t, px);
    // The disk is in front: where it glows, the stars are hidden.
    sky *= 1.0 - clamp(I * 3.0, 0.0, 1.0);
    I += sky * smoothstep(1.0, 1.08, r);
  }

  // ---- a faint halo, so the light reads as light ------------------------------
  float halo = exp(-max(r - 1.0, 0.0) * 2.4) * smoothstep(0.98, 1.05, r);
  I += 0.025 * halo * (p.y > wingMid ? 1.0 : 0.5) * step(r, 2.2);

  // Gentle Doppler asymmetry: the approaching side a touch brighter.
  I *= 1.0 - 0.06 * clamp(p.x / 2.5, -1.0, 1.0);

  // Soft highlight roll-off, monochrome, dithered against banding.
  float v = 1.0 - exp(-I * 1.45);
  // A black toe: the faint tails of glows and spikes are crushed to exactly zero, so
  // empty space is true #000 rather than a near-black wash.
  v *= smoothstep(0.012, 0.03, v);
  // Dither only where there is light, against banding in the disk.
  v += (hash(gl_FragCoord.xy + t) - 0.5) / 255.0 * step(0.03, v);
  gl_FragColor = vec4(vec3(v), 1.0);
}
`;

const VERTEX = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

export interface BlackHole {
  /** 1 at rest; larger values push the camera into the shadow. */
  setZoom(zoom: number): void;
  dispose(): void;
}

/** Returns null when WebGL is unavailable, so the caller can skip gracefully. */
export const createBlackHole = (
  canvas: HTMLCanvasElement,
  onFirstFrame: () => void,
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

  // One oversized triangle covers the screen.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uScale = gl.getUniformLocation(program, 'uScale');
  const uZoom = gl.getUniformLocation(program, 'uZoom');

  let zoom = 1;
  let frame = 0;
  let first = true;
  const start = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    // The shadow is ~19% of the shorter side, as in the reference: on a phone the
    // brim reaches the edges; on a wide screen it floats in the dark.
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform1f(uScale, 0.19 * Math.min(canvas.width, canvas.height));
    gl.uniform1f(uZoom, zoom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (first) {
      first = false;
      onFirstFrame();
    }
  };
  frame = requestAnimationFrame(draw);

  return {
    setZoom(z) {
      zoom = z;
    },
    dispose() {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Deliberately not loseContext(): the same canvas may be set up again (React runs
      // effects twice in development), and a lost context cannot be reused.
    },
  };
};
