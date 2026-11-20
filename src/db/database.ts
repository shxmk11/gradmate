
import Dexie, { type Table } from 'dexie'

export const CATEGORIES = [
  '핵심전공',
  '심화전공',
  '공통교양',
  '핵심교양',
  '진로소양',
  '복수전공',
  '부전공',
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
  /** 학년 (1~4, 5 이상은 추가학기). 휴학해도 밀리지 않게 연도 대신 학년으로 저장 */
  level: number
  semester: '1학기' | '2학기'
}

export interface CareerState {
  key: 'career'
  targetJobId: string | null
  manualSkills: string[]
  plan: PlannedCourse[]
  // 졸업 요건 화면에서 골라 본 자유선택 과정 (없으면 미정)
  freeTrackCase?: string | null
  /** 4학년 2학기 뒤에 더 다닐 추가학기 수 */
  extraSemesters?: number
  /** 주전공 기준을 넘긴 전공 학점을 컴공 복수전공으로 옮겨 보기 */
  shiftExcess?: boolean
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

    // 수강 계획을 연도 대신 학년으로 저장 (입학년도는 가장 이른 성적 연도로 추정)
    this.version(4)
      .stores({
        grades: '++id, year, semester, courseName, category',
        career: 'key',
      })
      .upgrade(async (tx) => {
        const grades = await tx.table('grades').toArray()
        const admission = grades.length > 0 ? Math.min(...grades.map((g) => g.year)) : 0
        await tx
          .table('career')
          .toCollection()
          .modify((state) => {
            state.plan = (state.plan ?? []).map(
              (p: { courseName: string; year?: number; level?: number; semester: string }) => ({
                courseName: p.courseName,
                level: p.level ?? (admission && p.year ? p.year - admission + 1 : 3),
                semester: p.semester,
              }),
            )
          })
      })
  }
}

export const db = new GradMateDatabase()
