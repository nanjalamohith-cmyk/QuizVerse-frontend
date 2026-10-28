import { motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Keyboard, Loader2, Send } from 'lucide-react'
import type { PointerEvent } from 'react'
import { formatTime } from '../format'
import type { Option, Quiz } from '../types'
import { ProgressRing } from './ProgressRing'

interface QuizScreenProps {
  quiz: Quiz
  index: number
  answers: Record<string, string>
  elapsed: number
  submitting: boolean
  error: string | null
  onSelect: (questionId: string, optionId: string) => void
  onNavigate: (index: number) => void
  onSubmit: () => void
}

function AnswerOption({
  option,
  position,
  selected,
  onSelect,
}: {
  option: Option
  position: number
  selected: boolean
  onSelect: () => void
}) {
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    event.currentTarget.style.setProperty('--ry', `${x * 6}deg`)
    event.currentTarget.style.setProperty('--rx', `${-y * 6}deg`)
  }

  const resetTilt = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--ry', '0deg')
    event.currentTarget.style.setProperty('--rx', '0deg')
  }

  return (
    <motion.div
      className="answer-wrap"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: 0.05 * position }}
    >
      <button
        type="button"
        className={`answer ${selected ? 'is-selected' : ''}`}
        aria-pressed={selected}
        data-option-id={option.id}
        onClick={onSelect}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
      >
        <span className="answer-key mono">{String.fromCharCode(65 + position)}</span>
        <span className="answer-text">{option.text}</span>
        <span className="answer-radio" aria-hidden="true">
          {selected ? <Check size={13} strokeWidth={3} /> : null}
        </span>
      </button>
    </motion.div>
  )
}

export function QuizScreen({
  quiz,
  index,
  answers,
  elapsed,
  submitting,
  error,
  onSelect,
  onNavigate,
  onSubmit,
}: QuizScreenProps) {
  const total = quiz.questions.length
  const current = quiz.questions[index]
  const selected = answers[current.id]
  const answeredCount = quiz.questions.filter((question) => answers[question.id]).length
  const isLast = index === total - 1

  return (
    <motion.main
      className="screen-page quiz"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.28 }}
    >
      <div className="quiz-grid">
        <motion.section
          className="glass question-panel"
          key={current.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="question-head">
            <span className="q-index mono">
              Q{String(index + 1).padStart(2, '0')} <em>/ {String(total).padStart(2, '0')}</em>
            </span>
            <span className="q-category mono">{current.category}</span>
          </header>

          <h1 className="question-prompt">{current.prompt}</h1>
          <p className="question-hint">Select one answer. Nothing is scored until you transmit.</p>

          <div className="answers" role="group" aria-label={`Answer options for question ${index + 1}`}>
            {current.options.map((option, position) => (
              <AnswerOption
                key={option.id}
                option={option}
                position={position}
                selected={selected === option.id}
                onSelect={() => onSelect(current.id, option.id)}
              />
            ))}
          </div>

          <footer className="quiz-footer">
            <div className="quiz-nav">
              <button
                className="btn ghost nav-btn"
                type="button"
                disabled={index === 0}
                onClick={() => onNavigate(index - 1)}
              >
                <ChevronLeft size={17} /> Back
              </button>

              <div className="dots" role="group" aria-label="Question navigation">
                {quiz.questions.map((question, dotIndex) => (
                  <button
                    key={question.id}
                    type="button"
                    className={`dot ${dotIndex === index ? 'is-current' : ''} ${
                      answers[question.id] ? 'is-answered' : ''
                    }`}
                    onClick={() => onNavigate(dotIndex)}
                    aria-label={`Go to question ${dotIndex + 1}${answers[question.id] ? ', answered' : ''}`}
                    aria-current={dotIndex === index}
                  />
                ))}
              </div>

              {!isLast ? (
                <button className="btn ghost nav-btn" type="button" onClick={() => onNavigate(index + 1)}>
                  Next <ChevronRight size={17} />
                </button>
              ) : (
                <span className="nav-spacer" />
              )}
            </div>

            <div className="submit-row">
              {error ? (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="btn primary submit-btn" type="button" onClick={onSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="spin" size={17} /> Transmitting…
                  </>
                ) : (
                  <>
                    <Send size={17} /> Transmit answers
                  </>
                )}
                <span className="submit-count mono">
                  {answeredCount}/{total}
                </span>
              </button>
            </div>
          </footer>
        </motion.section>

        <aside className="quiz-aside">
          <div className="glass side-card progress-card">
            <span className="eyebrow mono">{quiz.title}</span>
            <ProgressRing answered={answeredCount} total={total} />
            <div className="side-stats">
              <div>
                <strong>{answeredCount}</strong>
                <span className="mono">LOCKED</span>
              </div>
              <div>
                <strong>{total - answeredCount}</strong>
                <span className="mono">OPEN</span>
              </div>
            </div>
          </div>

          <div className="glass side-card tip-card">
            <Keyboard size={17} />
            <div>
              <span className="eyebrow mono">FLIGHT CONTROLS</span>
              <p>
                Press <kbd>1</kbd>–<kbd>4</kbd> to answer, <kbd>←</kbd> <kbd>→</kbd> to navigate.
              </p>
            </div>
          </div>

          <div className="telemetry mono">
            <span>
              <i className="pulse-dot" /> ENCRYPTED CHANNEL
            </span>
            <span>{formatTime(elapsed)} ELAPSED</span>
          </div>
        </aside>
      </div>
    </motion.main>
  )
}
