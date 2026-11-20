
import Dexie, { type Table } from 'dexie'

export const CATEGORIES = [
  '공통교양',
  '핵심교양',
  '진로소양',
  '핵심전공',
  '심화전공',
  '일반선택',
] as const
export type Category = (typeof CATEGORIES)[number]

export interface Grade {
  id?: number
  year: number
  semester: '1학기' | '2학기' | '여름학기' | '겨울학기'
  courseName: string
  credits: number
  grade: string
  // v1에서 저장된 과목에는 없을 수 있음 (화면에서는 "미분류"로 표시)
  category?: Category
  // 세부 영역 (예: SW문해, 자연의 설명, 도전과 실천). 성적표의 '영역' 칸
  area?: string
}

class GradMateDatabase extends Dexie {
  grades!: Table<Grade, number>

  constructor() {
    super('GradMateDB')

    this.version(1).stores({
      grades: '++id, year, semester, courseName',
    })

    this.version(2).stores({
      grades: '++id, year, semester, courseName, category',
    })
  }
}

export const db = new GradMateDatabase()
