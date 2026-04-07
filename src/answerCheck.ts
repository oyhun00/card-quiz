import type { QuizItem } from './types'

function norm(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function isCorrectAnswer(item: QuizItem, userInput: string): boolean {
  const u = norm(userInput)
  if (!u) return false
  const candidates = [item.answer, ...(item.answers ?? [])].map(norm)
  return candidates.some((c) => c === u)
}
