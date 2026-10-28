import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

export function ScoreRing({ score, total }: { score: number; total: number }) {
  const size = 236
  const stroke = 11
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = total ? score / total : 0
  const count = useMotionValue(0)
  const rounded = useTransform(count, (value) => Math.round(value))

  useEffect(() => {
    const controls = animate(count, score, { duration: 1.5, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [count, score])

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Final score: ${score} out of ${total}`}
      >
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7ff" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 255, 0.1)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - fraction) }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: 'drop-shadow(0 0 12px rgba(139, 123, 255, 0.45))' }}
        />
      </svg>
      <div className="score-ring-center">
        <motion.span className="score-number">{rounded}</motion.span>
        <span className="score-denom mono">/ {String(total).padStart(2, '0')}</span>
        <span className="score-label mono">CORRECT</span>
      </div>
    </div>
  )
}
