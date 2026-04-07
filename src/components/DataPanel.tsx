import { useCallback, useEffect, useState } from 'react'
import type { QuestionBank } from '../types'
import { parseQuestionBank } from '../bankSchema'
import { defaultBankJson, saveBankJson } from '../storage'

type Props = {
  bank: QuestionBank
  rawJson: string
  onApply: (bank: QuestionBank, raw: string) => void
}

export function DataPanel({ bank, rawJson, onApply }: Props) {
  const [text, setText] = useState(rawJson)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setText(rawJson)
  }, [rawJson])

  const apply = useCallback(() => {
    try {
      const parsed = JSON.parse(text) as unknown
      const b = parseQuestionBank(parsed)
      const normalized = JSON.stringify(b, null, 2)
      saveBankJson(normalized)
      setError(null)
      onApply(b, normalized)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [text, onApply])

  const loadFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const f = input.files?.[0]
      if (!f) return
      const r = new FileReader()
      r.onload = () => {
        const s = typeof r.result === 'string' ? r.result : ''
        setText(s)
        setError(null)
      }
      r.readAsText(f, 'UTF-8')
    }
    input.click()
  }, [])

  const exportFile = useCallback(() => {
    try {
      const parsed = JSON.parse(text) as unknown
      const b = parseQuestionBank(parsed)
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'quiz-bank.json'
      a.click()
      URL.revokeObjectURL(url)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [text])

  const resetSample = useCallback(() => {
    ;(async () => {
      try {
        const raw = await defaultBankJson()
        const b = parseQuestionBank(JSON.parse(raw) as unknown)
        const normalized = JSON.stringify(b, null, 2)
        setText(normalized)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
  }, [])

  return (
    <div className="panel data-panel">
      <p className="hint">
        섹션별로 <code>items</code>에 <code>question</code> / <code>answer</code>를 넣습니다. 복수 정답은{' '}
        <code>answers</code> 배열을 추가하세요.
      </p>
      <div className="row-actions">
        <button type="button" className="btn" onClick={apply}>
          적용·저장
        </button>
        <button type="button" className="btn ghost" onClick={loadFile}>
          가져오기
        </button>
        <button type="button" className="btn ghost" onClick={exportFile}>
          내보내기
        </button>
        <button type="button" className="btn ghost" onClick={resetSample}>
          샘플로 초기화
        </button>
      </div>
      {error && <div className="msg err">{error}</div>}
      <textarea
        className="json-editor"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        aria-label="문제 은행 JSON"
      />
      <p className="meta">
        현재 섹션 {bank.sections.length}개 · 총 문항{' '}
        {bank.sections.reduce((n, s) => n + s.items.length, 0)}개
      </p>
    </div>
  )
}
