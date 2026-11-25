import React, { useEffect, useRef } from 'react';

interface GlobalEarthBackdropProps {
  theme: 'dark' | 'light';
  variant?: 'login' | 'workspace';
}

interface GlobePoint {
  x: number;
  y: number;
  z: number;
}

interface HubLocation {
  name: string;
  lat: number;
  lon: number;
  primary?: boolean;
}

interface ArcRoute {
  from: [number, number];
  to: [number, number];
  speed: number;
  phase: number;
}

function inEllipse(
  lat: number,
  lon: number,
  cLat: number,
  cLon: number,
  rLat: number,
  rLon: number,
  tilt = 0
): boolean {
  const dLat = lat - cLat;
  const dLon = lon - cLon;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const rx = dLon * cosT - dLat * sinT;
  const ry = dLon * sinT + dLat * cosT;
  return (rx * rx) / (rLon * rLon) + (ry * ry) / (rLat * rLat) <= 1;
}

function isLandMass(lat: number, lon: number): boolean {
  if (
    inEllipse(lat, lon, 52, -104, 15, 29, -0.22) ||
    inEllipse(lat, lon, 38, -96, 11, 22, 0.1) ||
    inEllipse(lat, lon, 63, -145, 7, 17, 0.08) ||
    inEllipse(lat, lon, 21, -100, 9, 8, -0.45) ||
    inEllipse(lat, lon, 12, -85, 5, 6, -0.5) ||
    inEllipse(lat, lon, 73, -42, 9, 14, 0.25)
  ) {
    return true;
  }

  if (
    inEllipse(lat, lon, -8, -60, 14, 15, -0.22) ||
    inEllipse(lat, lon, -23, -63, 16, 10, 0.28) ||
    inEllipse(lat, lon, -42, -69, 13, 5, 0.15)
  ) {
    return true;
  }

  if (
    inEllipse(lat, lon, 49, 13, 9, 18, 0.15) ||
    inEllipse(lat, lon, 62, 16, 8, 9, 0.35) ||
    inEllipse(lat, lon, 41, -4, 4.5, 6, 0.05) ||
    inEllipse(lat, lon, 54, -3, 4.2, 3.2, 0.1) ||
    inEllipse(lat, lon, 42, 13, 4.5, 2.6, -0.4)
  ) {
    return true;
  }

  if (
    inEllipse(lat, lon, 22, 11, 13, 22, 0.02) ||
    inEllipse(lat, lon, 5, 23, 12, 14, -0.05) ||
    inEllipse(lat, lon, -15, 24, 16, 11, 0.08) ||
    inEllipse(lat, lon, 8, 43, 7, 6, 0.35) ||
    inEllipse(lat, lon, -19, 46.5, 6.5, 2.8, 0.2)
  ) {
    return true;
  }

  if (
    inEllipse(lat, lon, 24, 45, 9, 9, -0.35) ||
    inEllipse(lat, lon, 33, 52, 7, 12, -0.1) ||
    inEllipse(lat, lon, 58, 72, 13, 38, 0.05) ||
    inEllipse(lat, lon, 62, 125, 11, 32, -0.08) ||
    inEllipse(lat, lon, 36, 104, 13, 21, 0.12) ||
    inEllipse(lat, lon, 21, 79, 11, 7.5, 0.04) ||
    inEllipse(lat, lon, 7.8, 80.7, 2.8, 2.2, 0) ||
    inEllipse(lat, lon, 16, 101, 9, 6.5, -0.15) ||
    inEllipse(lat, lon, 37, 139, 5, 2.6, 0.45) ||
    inEllipse(lat, lon, -1, 114, 5, 12, -0.1) ||
    inEllipse(lat, lon, 12, 122, 5, 2.4, 0.2)
  ) {
    return true;
  }

  if (
    inEllipse(lat, lon, -25, 134, 11, 19, -0.05) ||
    inEllipse(lat, lon, -42, 172, 4.5, 3, 0.45) ||
    inEllipse(lat, lon, -5, 142, 4.5, 6.5, -0.2)
  ) {
    return true;
  }

  return false;
}

function latLonToUnit(latDeg: number, lonDeg: number): GlobePoint {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const cosLat = Math.cos(lat);
  return {
    x: cosLat * Math.sin(lon),
    y: Math.sin(lat),
    z: cosLat * Math.cos(lon)
  };
}

function rotatePoint(p: GlobePoint, rotLon: number, tiltX: number): GlobePoint {
  const cosL = Math.cos(rotLon);
  const sinL = Math.sin(rotLon);
  const x1 = p.x * cosL - p.z * sinL;
  const z1 = p.x * sinL + p.z * cosL;
  const y1 = p.y;

  const cosT = Math.cos(tiltX);
  const sinT = Math.sin(tiltX);
  const y2 = y1 * cosT - z1 * sinT;
  const z2 = y1 * sinT + z1 * cosT;

  return { x: x1, y: y2, z: z2 };
}

function buildFibonacciLandPoints(): GlobePoint[] {
  const points: GlobePoint[] = [];
  const totalSamples = 2400;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < totalSamples; i += 1) {
    const y = 1 - (i / (totalSamples - 1)) * 2;
    const latRad = Math.asin(y);
    const latDeg = (latRad * 180) / Math.PI;
    const rawLon = (goldenAngle * i) % (Math.PI * 2);
    let lonDeg = (rawLon * 180) / Math.PI;
    if (lonDeg > 180) lonDeg -= 360;

    if (Math.abs(latDeg) > 78) continue;
    if (isLandMass(latDeg, lonDeg)) {
      points.push(latLonToUnit(latDeg, lonDeg));
    }
  }
  return points;
}

const LAND_POINTS = buildFibonacciLandPoints();

const GLOBAL_HUBS: HubLocation[] = [
  { name: 'Colombo / Ratnapura', lat: 6.93, lon: 79.86, primary: true },
  { name: 'Geneva OCHA', lat: 46.2, lon: 6.14 },
  { name: 'Singapore Hub', lat: 1.35, lon: 103.82 },
  { name: 'Nairobi Regional', lat: -1.29, lon: 36.82 },
  { name: 'Tokyo Dispatch', lat: 35.68, lon: 139.69 },
  { name: 'New York UN', lat: 40.71, lon: -74.0 },
  { name: 'Sydney Logistics', lat: -33.87, lon: 151.21 }
];

const AID_ARCS: ArcRoute[] = [
  { from: [46.2, 6.14], to: [6.93, 79.86], speed: 0.24, phase: 0.05 },
  { from: [1.35, 103.82], to: [6.93, 79.86], speed: 0.31, phase: 0.38 },
  { from: [-1.29, 36.82], to: [6.93, 79.86], speed: 0.26, phase: 0.68 },
  { from: [35.68, 139.69], to: [1.35, 103.82], speed: 0.28, phase: 0.19 },
  { from: [40.71, -74.0], to: [46.2, 6.14], speed: 0.22, phase: 0.52 },
  { from: [-33.87, 151.21], to: [1.35, 103.82], speed: 0.25, phase: 0.81 }
];

function buildArcSamples(from: [number, number], to: [number, number], steps = 38): GlobePoint[] {
  const a = latLonToUnit(from[0], from[1]);
  const b = latLonToUnit(to[0], to[1]);
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
  const angle = Math.acos(dot);
  const peakLift = 0.08 + Math.min(0.22, angle * 0.12);
  const samples: GlobePoint[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const lx = a.x * (1 - t) + b.x * t;
    const ly = a.y * (1 - t) + b.y * t;
    const lz = a.z * (1 - t) + b.z * t;
    const len = Math.hypot(lx, ly, lz) || 1;
    const lift = 1 + peakLift * Math.sin(Math.PI * t);
    samples.push({
      x: (lx / len) * lift,
      y: (ly / len) * lift,
      z: (lz / len) * lift
    });
  }
  return samples;
}

const PRECOMPUTED_ARCS = AID_ARCS.map((arc) => ({
  ...arc,
  samples: buildArcSamples(arc.from, arc.to, 40)
}));

export const GlobalEarthBackdrop: React.FC<GlobalEarthBackdropProps> = ({
  theme,
  variant = 'workspace'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let rotLon = -1.35;
    const tiltX = 0.26;
    let lastTs = performance.now();

    const isDark = theme === 'dark';
    const isLogin = variant === 'login';

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      if (!document.hidden) {
        rotLon += dt * (prefersReducedMotion ? 0.015 : isLogin ? 0.13 : 0.085);
      }

      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 768;
      const baseDim = Math.min(width, height);
      const radius = isLogin
        ? isMobile
          ? baseDim * 0.44
          : Math.min(440, baseDim * 0.44)
        : isMobile
        ? baseDim * 0.42
        : Math.min(410, baseDim * 0.41);

      const cx = isLogin
        ? isMobile
          ? width * 0.5
          : width * 0.54
        : isMobile
        ? width * 0.5
        : width * 0.72;
      const cy = isLogin
        ? isMobile
          ? height * 0.36
          : height * 0.49
  );
};

export function legacyFilterRequestsByText(items: any[], query: string, urgencyFilter: string) {
  const normalized = (query || '').trim().toLowerCase();
  return (items || []).filter((item) => {
    const matchesUrgency = !urgencyFilter || urgencyFilter === 'ALL' || item?.urgency === urgencyFilter;
    const hay = `${item?.title || ''} ${item?.description || ''} ${item?.locationAddress || ''}`.toLowerCase();
    return matchesUrgency && (!normalized || hay.includes(normalized));
  });
}

export function legacyComputePriorityRank(affectedCount: number, urgencyRank: number): number {
  const capCount = Math.min(200, Math.max(1, affectedCount || 1));
  const rawScore = urgencyRank * 18 + Math.log2(capCount + 1) * 4.2;
  return Number(Math.min(100, rawScore).toFixed(1));
}

export function legacyFormatCsvCell(raw: unknown): string {
  const text = String(raw ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

export const LEGACY_EXPORT_COLUMNS = [
  'referenceCode',
  'category',
  'urgency',
  'status',
  'affectedPeopleCount',
  'locationAddress'
];
