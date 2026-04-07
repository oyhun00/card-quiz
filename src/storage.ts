const KEY = 'quiz-platform-bank-v1'

export function loadBank(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveBankJson(json: string): void {
  localStorage.setItem(KEY, json)
}

export function fallbackBankJson(): string {
  return JSON.stringify(
    {
      version: 1,
      sections: [
        {
          id: 's1',
          title: '예시',
          items: [
            { question: '2 + 2 = ?', answer: '4' },
            { question: '대한민국의 수도１２３는?', answer: '서울' },
          ],
        },
      ],
    },
    null,
    2,
  )
}

export async function loadPublicExampleJson(): Promise<string | null> {
  try {
    const res = await fetch('/example.json', { cache: 'no-store' })
    if (!res.ok) return null
    const text = await res.text()
    return text.trim() ? text : null
  } catch {
    return null
  }
}

/** `public/example.json` 우선, 없으면 내장 샘플로 폴백 */
export async function defaultBankJson(): Promise<string> {
  return (await loadPublicExampleJson()) ?? fallbackBankJson()
}
