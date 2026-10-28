import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, User } from 'lucide-react'
import type { FormEvent } from 'react'
import type { Leaderboard, Quiz } from '../types'
import { LeaderboardPanel } from './LeaderboardPanel'

interface LandingScreenProps {
  quiz: Quiz
  leaderboard: Leaderboard
  callSign: string
  onCallSignChange: (value: string) => void
  onStart: () => void
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
}

export function LandingScreen({ quiz, leaderboard, callSign, onCallSignChange, onStart }: LandingScreenProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onStart()
  }

  return (
    <motion.main
      className="screen-page landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
    >
      <div className="landing-grid">
        <motion.section className="landing-copy" variants={container} initial="hidden" animate="show">
          <motion.div className="eyebrow-chip" variants={item}>
            <Sparkles size={13} />
            INTERACTIVE 3D · {quiz.questionCount} QUESTIONS · LIVE SCORING
          </motion.div>

          <motion.h1 className="hero-title" variants={item}>
            How far does
            <br />
            your <span className="text-grad">curiosity</span>
            <br />
            reach?
          </motion.h1>

          <motion.p className="lede" variants={item}>
            A {quiz.questionCount}-question expedition across planetary science, quantum physics, and the deep
            unknown. Answer, transmit, and watch mission control score your signal in real time.
          </motion.p>

          <motion.form className="launch-form" variants={item} onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label mono">YOUR CALL SIGN</span>
              <span className="field-input">
                <User size={16} aria-hidden="true" />
                <input
                  type="text"
                  value={callSign}
                  onChange={(event) => onCallSignChange(event.target.value)}
                  placeholder="e.g. Nova"
                  maxLength={24}
                  autoComplete="nickname"
                  aria-label="Your call sign"
                />
              </span>
            </label>
            <button className="btn primary launch-btn" type="submit">
              Start expedition <ArrowRight size={18} />
            </button>
          </motion.form>

          <motion.div className="metrics" variants={item}>
            <div className="metric">
              <span className="mono">EXPEDITION</span>
              <strong>
                {String(quiz.questionCount).padStart(2, '0')} <em>questions</em>
              </strong>
            </div>
            <div className="metric">
              <span className="mono">EST. TIME</span>
              <strong>
                ~{quiz.estimatedMinutes} <em>min</em>
              </strong>
            </div>
            <div className="metric">
              <span className="mono">SCORING</span>
              <strong>
                Instant <em>server-side</em>
              </strong>
            </div>
          </motion.div>

          <motion.p className="micro-note mono" variants={item}>
            Correct answers stay sealed until you transmit.
          </motion.p>
        </motion.section>

        <motion.aside
          className="landing-aside"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="orb-hint mono">
            <i /> MOVE YOUR CURSOR · POKE THE ORB
          </div>
          <LeaderboardPanel entries={leaderboard.entries} totalAttempts={leaderboard.totalAttempts} />
        </motion.aside>
      </div>
    </motion.main>
  )
}
