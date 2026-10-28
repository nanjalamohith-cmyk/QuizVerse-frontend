import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchLeaderboard, fetchQuiz, submitAnswers } from './api'
import { BootScreen } from './components/BootScreen'
import { ConfirmDialog } from './components/ConfirmDialog'
import { LandingScreen } from './components/LandingScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { Scene } from './components/Scene'
import { TopBar } from './components/TopBar'
import { useMediaQuery } from './hooks/useMediaQuery'
import type { Leaderboard, OrbMood, Phase, Quiz, Submission } from './types'

const CALL_SIGN_KEY = 'quizverse:call-sign'

function readCallSign(): string {
  try {
    return localStorage.getItem(CALL_SIGN_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveCallSign(value: string) {
  try {
    localStorage.setItem(CALL_SIGN_KEY, value)
  } catch {
    // Storage can be unavailable in private browsing; the quiz still works.
  }
}

type DialogKind = 'submit' | 'abort' | null

export default function App() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [bootLoading, setBootLoading] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const [loadKey, setLoadKey] = useState(0)

  const [phase, setPhase] = useState<Phase>('landing')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [index, setIndex] = useState(0)
  const [callSign, setCallSign] = useState(readCallSign)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<Submission | null>(null)
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [pulse, setPulse] = useState(0)

  const mobile = useMediaQuery('(max-width: 900px)')
  const reducedMotion = useReducedMotion() ?? false

  useEffect(() => {
    let cancelled = false
    setBootLoading(true)
    setBootError(null)

    fetchQuiz()
      .then(async (loadedQuiz) => {
        const loadedLeaderboard = await fetchLeaderboard(loadedQuiz.id)
        if (cancelled) return
        setQuiz(loadedQuiz)
        setLeaderboard(loadedLeaderboard)
        setBootLoading(false)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setBootError(error instanceof Error ? error.message : 'The mission API did not answer.')
        setBootLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadKey])

  useEffect(() => {
    if (phase !== 'quiz' || startedAt === null) return
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [phase, startedAt])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title =
      phase === 'quiz'
        ? `Question ${index + 1} · QuizVerse`
        : phase === 'results'
          ? 'Debrief · QuizVerse'
          : 'QuizVerse — Interactive 3D Quiz'
  }, [phase, index])

  const answeredCount = useMemo(
    () => (quiz ? quiz.questions.filter((question) => answers[question.id]).length : 0),
    [quiz, answers],
  )
  const blanks = quiz ? quiz.questions.length - answeredCount : 0

  const selectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: optionId }))
    setPulse((value) => value + 1)
  }, [])

  const navigate = useCallback(
    (next: number) => {
      if (!quiz) return
      setIndex(Math.max(0, Math.min(quiz.questions.length - 1, next)))
    },
    [quiz],
  )

  const startQuiz = useCallback(() => {
    if (!quiz) return
    const clean = callSign.trim().slice(0, 24)
    setCallSign(clean)
    saveCallSign(clean)
    setAnswers({})
    setIndex(0)
    setResult(null)
    setSubmitError(null)
    setElapsed(0)
    setStartedAt(Date.now())
    setDialog(null)
    setPhase('quiz')
    setPulse((value) => value + 1)
  }, [quiz, callSign])

  const goHome = useCallback(() => {
    setPhase('landing')
    setAnswers({})
    setIndex(0)
    setResult(null)
    setSubmitError(null)
    setStartedAt(null)
    setElapsed(0)
    setDialog(null)
    setPulse((value) => value + 1)
  }, [])

  const transmit = async () => {
    if (!quiz) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const durationSeconds = startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
        : elapsed
      const submission = await submitAnswers(quiz.id, {
        studentName: callSign.trim() || 'Anonymous',
        answers,
        durationSeconds,
      })
      setResult(submission)
      setLeaderboard({
        quizId: quiz.id,
        totalAttempts: submission.totalAttempts,
        entries: submission.leaderboard,
      })
      setPhase('results')
      setPulse((value) => value + 1)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Transmission failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const requestSubmit = () => {
    if (!quiz || submitting) return
    if (blanks > 0) {
      setDialog('submit')
      return
    }
    void transmit()
  }

  const closeDialog = useCallback(() => setDialog(null), [])

  const confirmDialog = () => {
    if (dialog === 'submit') {
      setDialog(null)
      void transmit()
    } else if (dialog === 'abort') {
      goHome()
    }
  }

  useEffect(() => {
    if (phase !== 'quiz' || !quiz || dialog) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      const question = quiz.questions[index]
      const digit = Number(event.key)
      if (Number.isInteger(digit) && digit >= 1 && digit <= question.options.length) {
        event.preventDefault()
        selectAnswer(question.id, question.options[digit - 1].id)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        navigate(index + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        navigate(index - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, quiz, index, dialog, selectAnswer, navigate])

  const mood: OrbMood = useMemo(() => {
    if (phase === 'landing') return 'idle'
    if (phase === 'quiz') return submitting ? 'submitting' : 'quiz'
    if (!result) return 'success'
    if (result.percentage >= 80) return 'success'
    if (result.percentage >= 50) return 'mixed'
    return 'low'
  }, [phase, submitting, result])

  const pokeOrb = useCallback(() => setPulse((value) => value + 1), [])

  const dialogCopy =
    dialog === 'submit'
      ? {
          title: blanks === 1 ? 'One signal is missing' : `${blanks} signals are missing`,
          description: `You have locked ${answeredCount} of ${quiz?.questions.length ?? 0} answers. Unanswered questions are scored as incorrect. Transmit anyway?`,
          confirmLabel: 'Transmit anyway',
          cancelLabel: 'Keep answering',
        }
      : {
          title: 'Abort the expedition?',
          description: 'Your locked answers and elapsed time will be lost. You can restart from the launch pad at any time.',
          confirmLabel: 'Abort mission',
          cancelLabel: 'Stay in orbit',
        }

  const showShell = Boolean(quiz) && !bootLoading && !bootError

  return (
    <div className="app">
      <Scene phase={phase} mood={mood} pulse={pulse} mobile={mobile} reduced={reducedMotion} onPoke={pokeOrb} />
      <div className="grain" aria-hidden="true" />

      <div className="screen">
        {showShell && quiz ? (
          <TopBar
            phase={phase}
            elapsed={elapsed}
            answered={answeredCount}
            total={quiz.questions.length}
            callSign={callSign}
            onExit={() => setDialog('abort')}
          />
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {bootLoading ? (
            <BootScreen key="boot-loading" mode="loading" />
          ) : bootError || !quiz || !leaderboard ? (
            <BootScreen
              key="boot-error"
              mode="error"
              message={bootError ?? 'The expedition could not be loaded.'}
              onRetry={() => setLoadKey((value) => value + 1)}
            />
          ) : phase === 'landing' ? (
            <LandingScreen
              key="landing"
              quiz={quiz}
              leaderboard={leaderboard}
              callSign={callSign}
              onCallSignChange={setCallSign}
              onStart={startQuiz}
            />
          ) : phase === 'quiz' ? (
            <QuizScreen
              key="quiz"
              quiz={quiz}
              index={index}
              answers={answers}
              elapsed={elapsed}
              submitting={submitting}
              error={submitError}
              onSelect={selectAnswer}
              onNavigate={navigate}
              onSubmit={requestSubmit}
            />
          ) : result ? (
            <ResultsScreen
              key={`results-${result.attemptId}`}
              quiz={quiz}
              result={result}
              leaderboardEntries={leaderboard.entries}
              leaderboardTotal={leaderboard.totalAttempts}
              reducedMotion={reducedMotion}
              onRetake={startQuiz}
              onHome={goHome}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialogCopy.title}
        description={dialogCopy.description}
        confirmLabel={dialogCopy.confirmLabel}
        cancelLabel={dialogCopy.cancelLabel}
        busy={submitting}
        onConfirm={confirmDialog}
        onClose={closeDialog}
      />
    </div>
  )
}
