import type { Category, Grade } from '../db/database'

// 4.5 만점 기준 성적별 평점
export const GRADE_POINTS: Record<string, number> = {
  'A+': 4.5,
  A0: 4.0,
  'B+': 3.5,
  B0: 3.0,
  'C+': 2.5,
  C0: 2.0,
  'D+': 1.5,
  D0: 1.0,
  F: 0,
}

const SEMESTER_ORDER: Record<Grade['semester'], number> = {
  '1학기': 1,
  여름학기: 2,
  '2학기': 3,
  겨울학기: 4,
}

// P는 평점 계산에서 제외. F는 평점 계산에 포함(0점).
const isGpaCourse = (g: Grade) => g.grade in GRADE_POINTS

// F는 취득 학점에서 제외. P는 취득 학점에 포함.
const isEarned = (g: Grade) => g.grade !== 'F'

/** 평점 평균. 평점 대상 과목이 없으면 null */
export function calcGpa(grades: Grade[]): number | null {
  const targets = grades.filter(isGpaCourse)
  const totalCredits = targets.reduce((sum, g) => sum + g.credits, 0)
  if (totalCredits === 0) return null

  const totalPoints = targets.reduce(
    (sum, g) => sum + GRADE_POINTS[g.grade] * g.credits,
    0,
  )
  return totalPoints / totalCredits
}

/** 취득 학점 합계 */
export function calcEarnedCredits(grades: Grade[]): number {
  return grades.filter(isEarned).reduce((sum, g) => sum + g.credits, 0)
}

export interface SemesterGpa {
  year: number
  semester: Grade['semester']
  gpa: number | null
  cumulativeGpa: number | null
  earnedCredits: number
}

/** 학기별 GPA와 해당 학기까지의 누적 GPA (시간순) */
export function calcSemesterGpas(grades: Grade[]): SemesterGpa[] {
  const keys = new Map<string, { year: number; semester: Grade['semester'] }>()
  for (const g of grades) {
    keys.set(`${g.year}-${g.semester}`, { year: g.year, semester: g.semester })
  }

  const sorted = [...keys.values()].sort(
    (a, b) =>
      a.year - b.year || SEMESTER_ORDER[a.semester] - SEMESTER_ORDER[b.semester],
  )

  const accumulated: Grade[] = []
  return sorted.map(({ year, semester }) => {
    const current = grades.filter(
      (g) => g.year === year && g.semester === semester,
    )
    accumulated.push(...current)
    return {
      year,
      semester,
      gpa: calcGpa(current),
      cumulativeGpa: calcGpa(accumulated),
      earnedCredits: calcEarnedCredits(current),
    }
  })
}

/** 영역별 취득 학점. 영역이 없는 과목은 "미분류" */
export function calcCreditsByCategory(
  grades: Grade[],
): Record<Category | '미분류', number> {
  const result: Record<Category | '미분류', number> = {
    공통교양: 0,
    핵심교양: 0,
    진로소양: 0,
    핵심전공: 0,
    미분류: 0,
  }
  for (const g of grades.filter(isEarned)) {
    result[g.category ?? '미분류'] += g.credits
  }
  return result
}
