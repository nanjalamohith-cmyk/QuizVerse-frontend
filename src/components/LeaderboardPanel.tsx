import { Database } from 'lucide-react'
import { formatTime, initials } from '../format'
import type { LeaderboardEntry } from '../types'

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[]
  totalAttempts: number
  currentAttemptId?: string
}

export function LeaderboardPanel({ entries, totalAttempts, currentAttemptId }: LeaderboardPanelProps) {
  return (
    <div className="glass leaderboard">
      <header className="board-head">
        <div>
          <span className="eyebrow mono">LIVE SIGNALS</span>
          <h3>Top orbits</h3>
        </div>
        <span className="live-badge mono">
          <i /> LIVE
        </span>
      </header>

      {entries.length === 0 ? (
        <p className="board-empty">No transmissions yet. Be the first signal.</p>
      ) : (
        <ol className="board-list">
          {entries.map((entry, index) => {
            const isCurrent = entry.current || entry.attemptId === currentAttemptId
            return (
              <li key={entry.attemptId} className={isCurrent ? 'is-current' : ''}>
                <span className="board-rank mono">{String(index + 1).padStart(2, '0')}</span>
                <span className="board-avatar" aria-hidden="true">
                  {initials(entry.studentName)}
                </span>
                <span className="board-name">
                  {entry.studentName}
                  {isCurrent ? <em className="you mono">YOU</em> : null}
                </span>
                <span className="board-score mono">
                  {entry.score}
                  <em>/{entry.total}</em>
                </span>
                <span className="board-time mono">{formatTime(entry.durationSeconds)}</span>
              </li>
            )
          })}
        </ol>
      )}

      <footer className="board-footer mono">
        <Database size={12} />
        {totalAttempts} run{totalAttempts === 1 ? '' : 's'} archived in MongoDB
      </footer>
    </div>
  )
}
