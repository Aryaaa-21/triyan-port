import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import { STAR_COUNT, type CosmosTier } from './capability';

/**
 * The cosmic entry: a slow drift forward through a field of stars and dust.
 * Restraint is the brief — no bloom, no colour, no nebula. Everything is a point.
 */

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTravel;
  uniform float uDepth;
  varying float vAlpha;
  void main() {
    // Wrap depth so the field is endless: a star that passes the camera reappears far away.
    vec3 p = position;
    p.z = mod(p.z + uTravel, uDepth) - uDepth;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.65 + 0.35 * sin(uTime * 0.6 + aPhase);
    // Fade stars in from the far plane and out as they pass the camera.
    float depth = -mv.z;
    vAlpha = twinkle * smoothstep(420.0, 160.0, depth) * smoothstep(2.0, 18.0, depth);
    gl_PointSize = aSize * uPixelRatio * (120.0 / depth);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`;

const DEPTH = 440;

const field = (count: number, radius: number, size: [number, number]) => {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    // Denser toward the centre, so the drift reads as depth rather than noise.
    const r = radius * Math.pow(Math.random(), 0.6) + 6;
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.sin(theta) * r * 0.62;
    positions[i * 3 + 2] = -Math.random() * DEPTH;
    sizes[i] = size[0] + Math.random() * (size[1] - size[0]);
    phases[i] = Math.random() * Math.PI * 2;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));
  return geometry;
};

export interface CosmosHandle {
  setProgress(p: number): void;
  setPointer(x: number, y: number): void;
  setTheme(color: string, light: boolean): void;
  pause(): void;
  resume(): void;
  dispose(): void;
}

export const createCosmos = (
  canvas: HTMLCanvasElement,
  tier: Exclude<CosmosTier, 'off'>,
  onFirstFrame: () => void,
): CosmosHandle => {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, tier === 'high' ? 1.5 : 1);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new PerspectiveCamera(60, 1, 0.1, 600);

  const counts = STAR_COUNT[tier];
  const makeUniforms = (opacity: number) => ({
    uTime: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    // Set from the theme's --fg before the first frame; see setTheme.
    uColor: { value: new Color() },
    uOpacity: { value: opacity },
    uTravel: { value: 0 },
    uDepth: { value: DEPTH },
  });
  const starUniforms = makeUniforms(0.9);
  const dustUniforms = makeUniforms(0.22);
  const makeMaterial = (uniforms: ReturnType<typeof makeUniforms>) =>
    new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms,
    });

  const starMaterial = makeMaterial(starUniforms);
  const dustMaterial = makeMaterial(dustUniforms);
  const stars = new Points(field(counts.stars, 140, [0.6, 2.2]), starMaterial);
  const dust = new Points(field(counts.dust, 60, [6, 14]), dustMaterial);
  scene.add(stars, dust);

  let width = 0;
  let height = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === width && rect.height === height) return;
    width = rect.width;
    height = rect.height;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let camX = 0;
  let camY = 0;
  let travel = 0;
  let running = true;
  let frame = 0;
  let last = performance.now();
  let first = true;

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    // A slow constant drift, accelerated by scrolling out of the opening.
    travel += dt * (3 + progress * 40);
    starUniforms.uTravel.value = travel % DEPTH;
    dustUniforms.uTravel.value = (travel * 1.4) % DEPTH;

    camX += (pointerX * 4 - camX) * 0.03;
    camY += (pointerY * 2.5 - camY) * 0.03;
    camera.position.set(camX, camY, 0);
    camera.lookAt(camX * 0.3, camY * 0.3, -100);
    dust.rotation.z = t * 0.01;

    starUniforms.uTime.value = t;
    dustUniforms.uTime.value = t;
    renderer.render(scene, camera);
    if (first) {
      first = false;
      onFirstFrame();
    }
  };
  frame = requestAnimationFrame(tick);

  return {
    setProgress(p) {
      progress = Math.max(0, Math.min(1, p));
    },
    setPointer(x, y) {
      pointerX = x;
      pointerY = y;
    },
    setTheme(color, light) {
      starUniforms.uColor.value.set(color);
      dustUniforms.uColor.value.set(color);
      for (const m of [starMaterial, dustMaterial]) {
        // Light ink on dark adds; dark ink on paper must not.
        m.blending = light ? NormalBlending : AdditiveBlending;
        m.needsUpdate = true;
      }
    },
    pause() {
      running = false;
    },
    resume() {
      if (!running) last = performance.now();
      running = true;
    },
    dispose() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      stars.geometry.dispose();
      dust.geometry.dispose();
      starMaterial.dispose();
      dustMaterial.dispose();
      renderer.dispose();
    },
  };
};
