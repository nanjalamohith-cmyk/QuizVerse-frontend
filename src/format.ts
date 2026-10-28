export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export interface Verdict {
  title: string
  line: string
}

export function verdictFor(percentage: number): Verdict {
  if (percentage === 100) {
    return {
      title: 'Perfect orbit.',
      line: 'Every answer landed. You own this corner of the cosmos — take a victory lap.',
    }
  }
  if (percentage >= 80) {
    return {
      title: 'Excellent trajectory.',
      line: 'Your signal cut through almost every question. The debrief below marks the last light-years.',
    }
  }
  if (percentage >= 50) {
    return {
      title: 'Solid signal.',
      line: 'You cleared the belt. Scan the debrief to see where the signal drifted.',
    }
  }
  if (percentage >= 25) {
    return {
      title: 'Rough re-entry.',
      line: 'The cosmos pushed back. Every explanation below is fuel for your next launch.',
    }
  }
  return {
    title: 'Signal fractured.',
    line: 'Space is humbling. Read the debrief, then jump straight back into the launch window.',
  }
}
