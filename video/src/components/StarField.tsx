import { useLayoutEffect, useMemo, useRef } from "react";
import { useVideoConfig } from "remotion";
import { STAR_FIELD } from "../lib/data";
import { seededRandom } from "../lib/random";

type ProjectedStar = { x: number; y: number; weight: number; hue: number };

const HUES = ["#3b2fb4", "#2a4fd6", "#4b96e3", "#3b2fb4", "#2a4fd6", "#f39a1e", "#e8501f"];

function projectField(): { stars: ProjectedStar[]; centerX: number; centerY: number; extent: number } {
  const random = seededRandom(96);
  const stars = STAR_FIELD.ra.map((ra, index) => {
    const radius = 90 + STAR_FIELD.dec[index];
    const angle = (ra * Math.PI) / 180;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), weight: Math.pow(random(), 6), hue: Math.floor(random() * HUES.length) };
  });
  const xs = stars.map((s) => s.x).sort((a, b) => a - b);
  const ys = stars.map((s) => s.y).sort((a, b) => a - b);
  const centerX = xs[Math.floor(xs.length / 2)];
  const centerY = ys[Math.floor(ys.length / 2)];
  const extent = xs[Math.floor(xs.length * 0.97)] - xs[Math.floor(xs.length * 0.03)];
  return { stars, centerX, centerY, extent };
}

export type StarFieldCamera = { zoom: number; focusX: number; focusY: number; rotation: number };

function projectStar(star: ProjectedStar, field: ReturnType<typeof projectField>, camera: StarFieldCamera, width: number, height: number) {
  const scale = (height / field.extent) * camera.zoom;
  const relX = star.x - field.centerX - camera.focusX;
  const relY = star.y - field.centerY - camera.focusY;
  const cos = Math.cos(camera.rotation);
  const sin = Math.sin(camera.rotation);
  return { sx: width / 2 + (relX * cos - relY * sin) * scale, sy: height / 2 + (relX * sin + relY * cos) * scale };
}

function drawStars(context: CanvasRenderingContext2D, field: ReturnType<typeof projectField>, camera: StarFieldCamera, size: { width: number; height: number }, options: { bright: boolean; twinkleTime: number; dimmed: number }) {
  const { width, height } = size;
  context.clearRect(0, 0, width, height);
  const zoomScale = Math.min(2.4, Math.pow(camera.zoom, 0.35));
  for (const [index, star] of field.stars.entries()) {
    if (options.bright && star.weight < 0.3) continue;
    const { sx, sy } = projectStar(star, field, camera, width, height);
    if (sx < -80 || sx > width + 80 || sy < -80 || sy > height + 80) continue;
    const twinkle = 0.75 + 0.25 * Math.sin(options.twinkleTime * 2.2 + index * 1.7);
    const radius = (options.bright ? 2 + star.weight * 7 : 0.8 + star.weight * 2.5) * zoomScale;
    context.globalAlpha = (0.35 + star.weight * 0.65) * twinkle * (1 - options.dimmed * 0.7) * (options.bright ? 0.55 : 1);
    context.fillStyle = HUES[star.hue];
    context.beginPath();
    context.ellipse(sx, sy, radius * (options.bright ? 2.2 : 1), radius, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

export function StarField({ camera, opacity = 1, twinkleTime = 0, dimmed = 0, smear = 1 }: { camera: StarFieldCamera; opacity?: number; twinkleTime?: number; dimmed?: number; smear?: number }) {
  const crispRef = useRef<HTMLCanvasElement>(null);
  const bleedRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useVideoConfig();
  const field = useMemo(projectField, []);

  useLayoutEffect(() => {
    const crisp = crispRef.current?.getContext("2d");
    const bleed = bleedRef.current?.getContext("2d");
    if (!crisp || !bleed) return;
    drawStars(crisp, field, camera, { width, height }, { bright: false, twinkleTime, dimmed });
    drawStars(bleed, field, camera, { width, height }, { bright: true, twinkleTime, dimmed });
  }, [camera, field, width, height, twinkleTime, dimmed]);

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="field-bleed" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={7} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={18 * smear} xChannelSelector="R" yChannelSelector="G" result="bled" />
          <feGaussianBlur in="bled" stdDeviation={`${7 * smear} ${2.5 * smear}`} />
        </filter>
      </svg>
      <canvas ref={bleedRef} width={width} height={height} style={{ position: "absolute", inset: 0, filter: "url(#field-bleed)" }} />
      <canvas ref={crispRef} width={width} height={height} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
