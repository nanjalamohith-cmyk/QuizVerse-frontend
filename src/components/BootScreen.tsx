import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'
import { LogoMark } from './LogoMark'

interface BootScreenProps {
  mode: 'loading' | 'error'
  message?: string
  onRetry?: () => void
}

export function BootScreen({ mode, message, onRetry }: BootScreenProps) {
  return (
    <motion.main
      className="boot-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`boot-mark ${mode === 'loading' ? 'is-loading' : ''}`}>
        <LogoMark />
        <span className="boot-orbit orbit-one" />
        <span className="boot-orbit orbit-two" />
      </div>
      <span className="eyebrow mono">{mode === 'loading' ? 'ESTABLISHING UPLINK' : 'UPLINK FAILED'}</span>
      <h1>{mode === 'loading' ? 'Calibrating your orbit…' : 'Mission control is unreachable'}</h1>
      <p className="boot-copy">
        {mode === 'loading'
          ? 'Fetching the expedition and live signals from the Spring Boot API.'
          : message ?? 'The quiz API did not answer. Check that it is running.'}
      </p>
      {mode === 'error' ? (
        <>
          <button className="btn primary" type="button" onClick={onRetry}>
            <RotateCw size={16} /> Retry uplink
          </button>
          <p className="boot-hint mono">cd backend &amp;&amp; mvn spring-boot:run</p>
        </>
      ) : (
        <span className="boot-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
    </motion.main>
  )
}
