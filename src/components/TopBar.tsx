import { Timer, X } from 'lucide-react'
import { formatTime } from '../format'
import type { Phase } from '../types'
import { LogoMark } from './LogoMark'

interface TopBarProps {
  phase: Phase
  elapsed: number
  answered: number
  total: number
  callSign: string
  onExit: () => void
}

export function TopBar({ phase, elapsed, answered, total, callSign, onExit }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <LogoMark />
        <span className="brand-name">QUIZVERSE</span>
        <span className="brand-tag mono">3D QUIZ</span>
      </div>

      {phase === 'quiz' ? (
        <div className="hud">
          <div className="hud-progress">
            <div className="hud-bar" aria-hidden="true">
              <span style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
            </div>
            <span className="mono hud-progress-label">
              {answered}/{total} locked
            </span>
          </div>
          <span className="timer mono" aria-live="off">
            <Timer size={14} /> {formatTime(elapsed)}
          </span>
          <button className="icon-btn" type="button" onClick={onExit} aria-label="Abort mission and return to base">
            <X size={17} />
          </button>
        </div>
      ) : (
        <div className="topbar-right">
          <span className="live-chip mono">
            <i /> API LINK ACTIVE
          </span>
          {callSign ? <span className="pilot-chip mono">{callSign}</span> : null}
        </div>
      )}
    </header>
  )
}
