import { motion } from 'framer-motion'

export function ProgressRing({ answered, total }: { answered: number; total: number }) {
  const size = 126
  const stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = total ? answered / total : 0

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 255, 0.12)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - fraction) }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7ff" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="progress-ring-center">
        <strong>{answered}</strong>
        <span className="mono">/ {total}</span>
      </div>
    </div>
  )
}
