export interface QuizItem {
  question: string
  answer: string
  answers?: string[]
}

export interface QuizSection {
  id: string
  title: string
  items: QuizItem[]
}

export interface QuestionBank {
  version: number
  sections: QuizSection[]
}
