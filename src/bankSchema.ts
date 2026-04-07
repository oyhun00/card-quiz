import type { QuestionBank, QuizItem, QuizSection } from './types'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseItem(raw: unknown, path: string): QuizItem {
  if (!isRecord(raw)) throw new Error(`${path}: 객체여야 합니다.`)
  const q = raw.question
  const a = raw.answer
  if (typeof q !== 'string' || !q.trim()) throw new Error(`${path}.question: 비어 있지 않은 문자열이어야 합니다.`)
  if (typeof a !== 'string' || !a.trim()) throw new Error(`${path}.answer: 비어 있지 않은 문자열이어야 합니다.`)
  let answers: string[] | undefined
  if (raw.answers !== undefined) {
    if (!Array.isArray(raw.answers)) throw new Error(`${path}.answers: 문자열 배열이어야 합니다.`)
    answers = raw.answers.map((x, i) => {
      if (typeof x !== 'string' || !x.trim()) throw new Error(`${path}.answers[${i}]: 비어 있지 않은 문자열이어야 합니다.`)
      return x
    })
  }
  return { question: q, answer: a, answers }
}

function parseSection(raw: unknown, index: number): QuizSection {
  const path = `sections[${index}]`
  if (!isRecord(raw)) throw new Error(`${path}: 객체여야 합니다.`)
  const id = raw.id
  const title = raw.title
  const items = raw.items
  if (typeof id !== 'string' || !id.trim()) throw new Error(`${path}.id: 비어 있지 않은 문자열이어야 합니다.`)
  if (typeof title !== 'string' || !title.trim()) throw new Error(`${path}.title: 비어 있지 않은 문자열이어야 합니다.`)
  if (!Array.isArray(items)) throw new Error(`${path}.items: 배열이어야 합니다.`)
  if (items.length === 0) throw new Error(`${path}.items: 최소 1개 문항이 필요합니다.`)
  return {
    id,
    title,
    items: items.map((it, j) => parseItem(it, `${path}.items[${j}]`)),
  }
}

export function parseQuestionBank(json: unknown): QuestionBank {
  if (!isRecord(json)) throw new Error('루트는 객체여야 합니다.')
  const version = json.version
  const sections = json.sections
  if (typeof version !== 'number' || version < 1) throw new Error('version: 1 이상의 숫자여야 합니다.')
  if (!Array.isArray(sections)) throw new Error('sections: 배열이어야 합니다.')
  if (sections.length === 0) throw new Error('sections: 최소 1개 섹션이 필요합니다.')
  return {
    version,
    sections: sections.map((s, i) => parseSection(s, i)),
  }
}
