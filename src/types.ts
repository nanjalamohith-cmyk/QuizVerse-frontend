export type Phase = 'landing' | 'quiz' | 'results'

export type OrbMood = 'idle' | 'quiz' | 'submitting' | 'success' | 'mixed' | 'low'

export interface Option {
  id: string
  text: string
}

export interface Question {
  id: string
  category: string
  prompt: string
  options: Option[]
}

export interface QuizSummary {
  id: string
  title: string
  tagline: string
  questionCount: number
  estimatedMinutes: number
}

export interface Quiz {
  id: string
  title: string
  tagline: string
  description: string
  estimatedMinutes: number
  questionCount: number
  questions: Question[]
}

export interface LeaderboardEntry {
  attemptId: string
  studentName: string
  score: number
  total: number
  percentage: number
  durationSeconds: number
  submittedAt: string
  current: boolean
}

export interface Leaderboard {
  quizId: string
  totalAttempts: number
  entries: LeaderboardEntry[]
}

export interface QuestionReview {
  questionId: string
  category: string
  prompt: string
  options: Option[]
  selectedOptionId: string | null
  correctOptionId: string
  correct: boolean
  explanation: string
}

export interface Submission {
  attemptId: string
  studentName: string
  score: number
  total: number
  percentage: number
  rank: number
  totalAttempts: number
  durationSeconds: number
  submittedAt: string
  reviews: QuestionReview[]
  leaderboard: LeaderboardEntry[]
}
