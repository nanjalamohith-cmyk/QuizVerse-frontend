import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="dialog glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="dialog-icon">
              <AlertTriangle size={20} />
            </span>
            <h3 id="dialog-title">{title}</h3>
            <p id="dialog-description">{description}</p>
            <div className="dialog-actions">
              <button className="btn ghost" type="button" onClick={onClose}>
                {cancelLabel}
              </button>
              <button className="btn primary" type="button" ref={confirmRef} onClick={onConfirm} disabled={busy}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
