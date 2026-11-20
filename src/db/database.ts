
import Dexie, { type Table } from 'dexie'

export const CATEGORIES = [
  '핵심전공',
  '심화전공',
  '공통교양',
  '핵심교양',
  '진로소양',
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

// 진로 관리 설정 (희망 직무, 직접 체크한 역량, 학기별 수강 계획)
export interface PlannedCourse {
  courseName: string
  year: number
  semester: '1학기' | '2학기'
}

export interface CareerState {
  key: 'career'
  targetJobId: string | null
  manualSkills: string[]
  plan: PlannedCourse[]
}

class GradMateDatabase extends Dexie {
  grades!: Table<Grade, number>
  career!: Table<CareerState, string>

  constructor() {
    super('GradMateDB')

    this.version(1).stores({
      grades: '++id, year, semester, courseName',
    })

    this.version(2).stores({
      grades: '++id, year, semester, courseName, category',
    })

    this.version(3).stores({
      grades: '++id, year, semester, courseName, category',
      career: 'key',
    })
  }
}

export const db = new GradMateDatabase()
