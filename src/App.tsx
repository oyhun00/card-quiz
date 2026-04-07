import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import type { QuestionBank } from './types'
import { parseQuestionBank } from './bankSchema'
import { DataPanel } from './components/DataPanel'
import { QuizPanel } from './components/QuizPanel'
import { defaultBankJson, fallbackBankJson } from './storage'

type Tab = 'quiz' | 'data'

export default function App() {
  const init = useMemo(() => {
    const raw = fallbackBankJson()
    try {
      const bank = parseQuestionBank(JSON.parse(raw) as unknown)
      return { bank, raw: JSON.stringify(bank, null, 2) }
    } catch {
      const fallback = fallbackBankJson()
      const bank = parseQuestionBank(JSON.parse(fallback) as unknown)
      return { bank, raw: fallback }
    }
  }, [])

  const [bank, setBank] = useState<QuestionBank>(init.bank)
  const [rawJson, setRawJson] = useState(init.raw)
  const [tab, setTab] = useState<Tab>('quiz')

  const onApply = useCallback((b: QuestionBank, raw: string) => {
    setBank(b)
    setRawJson(raw)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await defaultBankJson()
        const parsed = parseQuestionBank(JSON.parse(raw) as unknown)
        const normalized = JSON.stringify(parsed, null, 2)
        setBank(parsed)
        setRawJson(normalized)
      } catch {
        // public/example.json이 깨져 있어도 앱은 계속 동작해야 함
      }
    })()
  }, [])

  return (
    <div className="app">
      <header className="top">
        <span className="brand">·</span>
        <nav className="tabs" aria-label="화면 전환">
          <button
            type="button"
            className={tab === 'quiz' ? 'tab on' : 'tab'}
            onClick={() => setTab('quiz')}
          >
            학습
          </button>
          <button
            type="button"
            className={tab === 'data' ? 'tab on' : 'tab'}
            onClick={() => setTab('data')}
          >
            데이터
          </button>
        </nav>
      </header>

      <main className="main">
        {tab === 'quiz' && <QuizPanel bank={bank} />}
        {tab === 'data' && <DataPanel bank={bank} rawJson={rawJson} onApply={onApply} />}
      </main>
    </div>
  )
}
