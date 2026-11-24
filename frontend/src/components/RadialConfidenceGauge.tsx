import React from 'react';
import { motion } from 'framer-motion';

interface RadialConfidenceGaugeProps {
  percentage: number;
  size?: number;
}

export const RadialConfidenceGauge: React.FC<RadialConfidenceGaugeProps> = ({
  percentage,
  size = 64
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const ringColor =
    clamped >= 80
      ? '#10b981'
      : clamped >= 65
      ? '#6366f1'
      : '#f59e0b';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={`AI confidence ${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.22)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xs font-extrabold font-mono text-white">{clamped}%</span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
          AI Conf
        </span>
      </div>
    </div>
  );
};
