import type { Leaderboard, Quiz, QuizSummary, Submission } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Mission control is unreachable. Is the backend running on port 8081?', 0)
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // Response was not JSON; keep the generic message.
    }
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as T
}

export async function fetchQuiz(): Promise<Quiz> {
  const quizzes = await request<QuizSummary[]>('/quizzes')
  if (!quizzes.length) {
    throw new ApiError('No expeditions are configured yet.', 404)
  }
  return request<Quiz>(`/quizzes/${encodeURIComponent(quizzes[0].id)}`)
}

export function fetchLeaderboard(quizId: string): Promise<Leaderboard> {
  return request<Leaderboard>(`/quizzes/${encodeURIComponent(quizId)}/leaderboard`)
}

export interface SubmitPayload {
  studentName: string
  answers: Record<string, string>
  durationSeconds: number
}

export function submitAnswers(quizId: string, payload: SubmitPayload): Promise<Submission> {
  return request<Submission>(`/quizzes/${encodeURIComponent(quizId)}/submissions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
