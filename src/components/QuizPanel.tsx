import { useCallback, useEffect, useMemo, useState } from 'react'
import type { QuestionBank, QuizItem } from '../types'
import { shuffle } from '../shuffle'
import { isCorrectAnswer } from '../answerCheck'

type Props = {
  bank: QuestionBank
}

type Phase = 'idle' | 'running' | 'done'

export function QuizPanel({ bank }: Props) {
  const [sectionId, setSectionId] = useState(() => bank.sections[0]?.id ?? '')
  const [phase, setPhase] = useState<Phase>('idle')
  const [queue, setQueue] = useState<QuizItem[]>([])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    if (bank.sections.length === 0) return
    if (!bank.sections.some((s) => s.id === sectionId)) {
      setSectionId(bank.sections[0].id)
    }
  }, [bank.sections, sectionId])

  const section = useMemo(
    () => bank.sections.find((s) => s.id === sectionId) ?? bank.sections[0],
    [bank.sections, sectionId],
  )

  const current = queue[index] ?? null
  const total = queue.length

  const start = useCallback(() => {
    const sec = bank.sections.find((s) => s.id === sectionId)
    if (!sec || sec.items.length === 0) return
    setQueue(shuffle(sec.items))
    setIndex(0)
    setInput('')
    setLastOk(null)
    setScore(0)
    setAnswered(false)
    setPhase('running')
  }, [bank.sections, sectionId])

  const submit = useCallback(() => {
    if (phase !== 'running' || !current || answered) return
    const ok = isCorrectAnswer(current, input)
    setLastOk(ok)
    if (ok) setScore((s) => s + 1)
    setAnswered(true)
  }, [phase, current, input, answered])

  const next = useCallback(() => {
    if (phase !== 'running') return
    if (index + 1 >= queue.length) {
      setPhase('done')
      return
    }
    setIndex((i) => i + 1)
    setInput('')
    setLastOk(null)
    setAnswered(false)
  }, [phase, index, queue.length])

  const stop = useCallback(() => {
    setPhase('idle')
    setQueue([])
    setIndex(0)
    setInput('')
    setLastOk(null)
    setAnswered(false)
  }, [])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (answered) next()
        else submit()
      }
    },
    [answered, next, submit],
  )

  if (bank.sections.length === 0) {
    return <p className="muted">데이터 탭에서 문제 은행을 먼저 넣어 주세요.</p>
  }

  return (
    <div className="panel quiz-panel">
      <div className="row">
        <label className="lbl">
          섹션
          <select
            className="select"
            value={section?.id ?? ''}
            onChange={(e) => {
              setSectionId(e.target.value)
              setPhase('idle')
            }}
            disabled={phase === 'running'}
          >
            {bank.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.items.length})
              </option>
            ))}
          </select>
        </label>
        {phase === 'idle' && (
          <button type="button" className="btn" onClick={start}>
            시작
          </button>
        )}
        {phase === 'running' && (
          <button type="button" className="btn ghost" onClick={stop}>
            중단
          </button>
        )}
        {phase === 'done' && (
          <button type="button" className="btn" onClick={() => setPhase('idle')}>
            닫기
          </button>
        )}
      </div>

      {phase === 'idle' && <p className="muted">섹션을 고르고 시작하면 문항 순서가 무작위로 섞입니다.</p>}

      {phase === 'running' && current && (
        <>
          <p className="progress">
            {index + 1} / {total} · 맞힘 {score}
          </p>
          <div className="card">
            <p className="q">{current.question}</p>
            <input
              type="text"
              className="inp"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="답 입력"
              disabled={answered}
              autoComplete="off"
              autoFocus
            />
            {!answered && (
              <button type="button" className="btn sm" onClick={submit}>
                확인
              </button>
            )}
            {answered && lastOk !== null && (
              <div className={lastOk ? 'msg ok' : 'msg err'}>
                {lastOk ? '정답' : `오답 — 정답: ${current.answer}`}
              </div>
            )}
            {answered && (
              <button type="button" className="btn sm" onClick={next}>
                {index + 1 >= total ? '결과 보기' : '다음'}
              </button>
            )}
          </div>
        </>
      )}

      {phase === 'done' && (
        <div className="card result">
          <p>끝</p>
          <p className="big">
            {score} / {total}
          </p>
          <button type="button" className="btn" onClick={start}>
            같은 섹션 다시
          </button>
        </div>
      )}
    </div>
  )
}
