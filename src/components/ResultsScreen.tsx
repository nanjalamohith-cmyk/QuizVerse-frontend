import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import {
  Check,
  CheckCircle2,
  Database,
  MinusCircle,
  RotateCcw,
  Trophy,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatTime, verdictFor } from '../format'
import type { LeaderboardEntry, QuestionReview, Quiz, Submission } from '../types'
import { LeaderboardPanel } from './LeaderboardPanel'
import { ScoreRing } from './ScoreRing'

interface ResultsScreenProps {
  quiz: Quiz
  result: Submission
  leaderboardEntries: LeaderboardEntry[]
  leaderboardTotal: number
  reducedMotion: boolean
  onRetake: () => void
  onHome: () => void
}

function ReviewCard({ review, index }: { review: QuestionReview; index: number }) {
  const status = review.correct ? 'correct' : review.selectedOptionId ? 'wrong' : 'skipped'

  return (
    <motion.article
      className={`glass review-card is-${status}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
    >
      <header className="review-head">
        <span className="review-index mono">{String(index + 1).padStart(2, '0')}</span>
        <span className="review-cat mono">{review.category}</span>
        <span className={`review-status mono is-${status}`}>
          {status === 'correct' ? (
            <>
              <CheckCircle2 size={13} /> CORRECT
            </>
          ) : status === 'wrong' ? (
            <>
              <XCircle size={13} /> INCORRECT
            </>
          ) : (
            <>
              <MinusCircle size={13} /> SKIPPED
            </>
          )}
        </span>
      </header>

      <h3>{review.prompt}</h3>

      <ul className="review-options">
        {review.options.map((option) => {
          const isCorrect = option.id === review.correctOptionId
          const isSelected = option.id === review.selectedOptionId
          const className = [
            'review-option',
            isCorrect ? 'is-correct' : '',
            isSelected && !isCorrect ? 'is-wrong' : '',
            isSelected ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={option.id} className={className}>
              <span className="review-key mono">{option.id.toUpperCase()}</span>
              <span className="review-option-text">{option.text}</span>
              {isCorrect ? (
                <span className="review-tag mono">
                  <Check size={11} strokeWidth={3} /> ANSWER
                </span>
              ) : null}
              {isSelected ? (
                <span className="review-tag mono is-pick">
                  {isCorrect ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />} YOUR PICK
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      <footer className="review-why">
        <span className="mono">WHY</span>
        <p>{review.explanation}</p>
      </footer>
    </motion.article>
  )
}

export function ResultsScreen({
  quiz,
  result,
  leaderboardEntries,
  leaderboardTotal,
  reducedMotion,
  onRetake,
  onHome,
}: ResultsScreenProps) {
  const verdict = verdictFor(result.percentage)
  const correctCount = result.reviews.filter((review) => review.correct).length
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || reducedMotion || result.percentage < 60) return
    fired.current = true
    const colors = ['#6ee7ff', '#a78bfa', '#34d399', '#f0abfc']
    confetti({
      particleCount: 85,
      spread: 76,
      origin: { x: 0.5, y: 0.38 },
      colors,
      scalar: 0.9,
      disableForReducedMotion: true,
    })
    const timer = window.setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      })
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      })
    }, 260)
    return () => window.clearTimeout(timer)
  }, [reducedMotion, result.percentage])

  return (
    <motion.main
      className="screen-page results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="results-inner">
        <section className="glass score-hero">
          <div className="score-block">
            <ScoreRing score={result.score} total={result.total} />
            <div className="score-copy">
              <span className="eyebrow-chip">
                <Trophy size={13} /> DEBRIEF COMPLETE
              </span>
              <h1>{verdict.title}</h1>
              <p>{verdict.line}</p>
              <div className="score-stats">
                <div>
                  <span className="mono">RANK</span>
                  <strong>#{result.rank}</strong>
                </div>
                <div>
                  <span className="mono">ACCURACY</span>
                  <strong>{result.percentage}%</strong>
                </div>
                <div>
                  <span className="mono">TIME</span>
                  <strong>{formatTime(result.durationSeconds)}</strong>
                </div>
              </div>
              <p className="score-signal mono">
                SIGNAL LOGGED FOR {result.studentName.toUpperCase()} · {result.totalAttempts} TOTAL RUN
                {result.totalAttempts === 1 ? '' : 'S'}
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button className="btn primary" type="button" onClick={onRetake}>
              <RotateCcw size={17} /> Run it again
            </button>
            <button className="btn ghost" type="button" onClick={onHome}>
              Back to base
            </button>
          </div>
        </section>

        <div className="debrief-grid">
          <section className="review-section" aria-label="Answer review">
            <header className="section-head">
              <div>
                <span className="eyebrow mono">MISSION DEBRIEF</span>
                <h2>Correct answers, unlocked.</h2>
              </div>
              <span className="review-count mono">
                {correctCount} / {result.total} ACCURATE
              </span>
            </header>

            <div className="review-list">
              {result.reviews.map((review, index) => (
                <ReviewCard key={review.questionId} review={review} index={index} />
              ))}
            </div>
          </section>

          <aside className="results-aside">
            <LeaderboardPanel
              entries={leaderboardEntries}
              totalAttempts={leaderboardTotal}
              currentAttemptId={result.attemptId}
            />

            <div className="glass side-card mongo-card">
              <span className="eyebrow mono">PERSISTED VIA</span>
              <div className="mongo-row">
                <span className="mongo-icon">
                  <Database size={17} />
                </span>
                <div>
                  <strong>MongoDB</strong>
                  <span className="mono">attempt + answers archived</span>
                </div>
              </div>
              <p>
                {quiz.title} runs on a Spring Boot API. Every submission is scored on the server — correct answers
                never reach the browser until you transmit.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </motion.main>
  )
}
