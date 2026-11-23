import React from 'react';
import { motion } from 'framer-motion';

type SparkColor = 'rose' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'cyan';

interface TelemetrySparklineProps {
  points: number[];
  color?: SparkColor;
  height?: number;
}

const STROKE_MAP: Record<SparkColor, { stroke: string; fillFrom: string; fillTo: string }> = {
  rose: { stroke: '#fb7185', fillFrom: 'rgba(244, 63, 94, 0.34)', fillTo: 'rgba(244, 63, 94, 0.02)' },
  indigo: { stroke: '#818cf8', fillFrom: 'rgba(99, 102, 241, 0.34)', fillTo: 'rgba(99, 102, 241, 0.02)' },
  emerald: { stroke: '#34d399', fillFrom: 'rgba(16, 185, 129, 0.34)', fillTo: 'rgba(16, 185, 129, 0.02)' },
  amber: { stroke: '#fbbf24', fillFrom: 'rgba(245, 158, 11, 0.34)', fillTo: 'rgba(245, 158, 11, 0.02)' },
  purple: { stroke: '#c084fc', fillFrom: 'rgba(168, 85, 247, 0.34)', fillTo: 'rgba(168, 85, 247, 0.02)' },
  cyan: { stroke: '#22d3ee', fillFrom: 'rgba(6, 182, 212, 0.34)', fillTo: 'rgba(6, 182, 212, 0.02)' }
};

export const TelemetrySparkline: React.FC<TelemetrySparklineProps> = ({
  points,
  color = 'indigo',
  height = 30
}) => {
  const normalized = points.length >= 2 ? points : [4, 7, 5, 9, 8, 12];
  const minVal = Math.min(...normalized);
  const maxVal = Math.max(...normalized);
  const range = Math.max(1, maxVal - minVal);
  const width = 120;
  const padY = 4;
  const usableH = height - padY * 2;

  const coords = normalized.map((val, idx) => {
    const x = (idx / (normalized.length - 1)) * width;
    const y = height - padY - ((val - minVal) / range) * usableH;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  });

  const linePath = coords
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const palette = STROKE_MAP[color];
  const gradId = `spark-${color}-${points.length}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full overflow-visible"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.fillFrom} />
          <stop offset="100%" stopColor={palette.fillTo} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={palette.stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
    </svg>
  );
};
