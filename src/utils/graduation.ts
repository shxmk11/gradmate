import { db, type Grade } from '../db/database'
import {
  REQUIREMENTS,
  type CreditRequirement,
  type RequiredCourse,
} from '../data/requirements'
import { IN_PROGRESS, calcEarnedCredits, earnedGrades } from './gpa'

// 띄어쓰기, 가운뎃점 차이를 무시하고 과목명 비교
export const normalize = (s: string) => s.replace(/[\s·・]/g, '')

export interface RequirementStatus extends CreditRequirement {
  earned: number
  remaining: number
  areas: string[]
}

export function calcRequirementStatus(
  grades: Grade[],
  item: CreditRequirement,
): RequirementStatus {
  const matched = earnedGrades(grades).filter(
    (g) => g.category && item.categories.includes(g.category),
  )
  const earned = matched.reduce((sum, g) => sum + g.credits, 0)
  const areas = [
    ...new Set(matched.map((g) => g.area?.trim()).filter((a): a is string => !!a)),
  ]
  return { ...item, earned, remaining: Math.max(item.credits - earned, 0), areas }
}

export interface RequiredCourseStatus extends RequiredCourse {
  done: boolean
  inProgress: boolean
}

/** 필수 과목 이수 여부. 수강 중이면 inProgress (아직 이수로 보지 않음) */
export function calcRequiredCourses(grades: Grade[]): RequiredCourseStatus[] {
  const earned = earnedGrades(grades)
  const find = (name: string) => earned.find((g) => normalize(g.courseName) === normalize(name))
  return REQUIREMENTS.requiredCourses.map((c) => {
    const g = find(c.name)
    return { ...c, done: !!g && g.grade !== IN_PROGRESS, inProgress: g?.grade === IN_PROGRESS }
  })
}

export function calcTotalProgress(grades: Grade[]) {
  const earned = calcEarnedCredits(grades)
  const total = REQUIREMENTS.totalCredits
  return {
    earned,
    total,
    remaining: Math.max(total - earned, 0),
    percent: Math.min((earned / total) * 100, 100),
  }
}

/** 대시보드에서 고른 자유선택 과정 (진로 관리 상태와 같은 곳에 저장) */
export async function loadFreeTrackCase() {
  const saved = await db.career.get('career')
  return saved?.freeTrackCase ?? null
}

export async function saveFreeTrackCase(id: string) {
  const saved = await db.career.get('career')
  await db.career.put({
    ...(saved ?? { key: 'career', targetJobId: null, manualSkills: [], plan: [] }),
    freeTrackCase: id,
  })
}

/** 성적이 있는 정규학기(1·2학기) 수 */
export function countRegularSemesters(grades: Grade[]) {
  return new Set(
    grades
      .filter((g) => g.semester === '1학기' || g.semester === '2학기')
      .map((g) => `${g.year}-${g.semester}`),
  ).size
}
