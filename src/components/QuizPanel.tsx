import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastSubmitAtRef = useRef<number>(0)

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
    lastSubmitAtRef.current = Date.now()
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

  useEffect(() => {
    if (phase !== 'running') return
    const onWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      // 입력칸이 disabled 상태면 keydown이 안 들어올 수 있어서(= '다음'이 안 됨) 윈도우에서 보정
      // 답 입력 중에는 Enter=채점(기존 input onKeyDown)만, 채점 후 화면에서는 Enter=다음만 동작
      if (!answered) return
      // 채점 직후 Enter 키 반복으로 즉시 다음으로 넘어가는 것을 방지
      if (Date.now() - lastSubmitAtRef.current < 250) return
      e.preventDefault()
      next()
    }
    window.addEventListener('keydown', onWindowKeyDown)
    return () => window.removeEventListener('keydown', onWindowKeyDown)
  }, [phase, answered, next])

  useEffect(() => {
    if (phase !== 'running') return
    if (answered) return
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(raf)
  }, [phase, index, answered])

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
              ref={inputRef}
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
