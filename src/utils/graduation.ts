import { db, type CareerState, type Grade } from '../db/database'
import {
  REQUIREMENTS,
  getFreeTrackCase,
  requirementGroups,
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
  /** 옮겨 보기로 들어온(+) 또는 나간(-) 학점 */
  shifted?: number
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

/** 진로·졸업 설정 (자유선택 과정, 추가학기 등). 진로 관리 상태와 같은 곳에 저장 */
export const loadCareer = () => db.career.get('career')

export async function saveCareerFields(fields: Partial<Omit<CareerState, 'key'>>) {
  const saved = await db.career.get('career')
  await db.career.put({
    ...(saved ?? { key: 'career', targetJobId: null, manualSkills: [], plan: [] }),
    ...fields,
  })
}

const withEarned = (s: RequirementStatus, earned: number, shifted: number): RequirementStatus => ({
  ...s,
  earned,
  remaining: Math.max(s.credits - earned, 0),
  shifted,
})

/** 주전공(핵심·심화) 기준을 넘긴 전공 학점 */
export function calcExcessMajorCredits(grades: Grade[]) {
  return REQUIREMENTS.groups
    .flatMap((g): CreditRequirement[] => g.items)
    .filter((i) => i.label === '핵심전공' || i.label === '심화전공')
    .map((i) => calcRequirementStatus(grades, i))
    .reduce((sum, i) => sum + Math.max(i.earned - i.credits, 0), 0)
}

/**
 * 영역 그룹별 이수 현황 (교양, 전공, 자유선택).
 * shift가 켜져 있고 컴공 복수전공을 하면, 주전공 기준을 넘긴 학점을 컴공 쪽으로 옮겨서 계산
 * (전공인정 과목이면 이수구분변경신청으로 옮길 수 있다는 가정)
 */
export function calcGroupStatuses(grades: Grade[], caseId: string | null | undefined, shift = false) {
  const groups = requirementGroups(caseId).map((g) => ({
    name: g.name,
    items: g.items.map((i) => calcRequirementStatus(grades, i)),
  }))
  if (!shift || !getFreeTrackCase(caseId).tracks.includes('ce')) return groups

  const all = groups.flatMap((g) => g.items)
  const target = all.find((i) => i.label.includes('컴퓨터공학과'))
  if (!target) return groups
  let left = Math.min(calcExcessMajorCredits(grades), target.remaining)
  const moved = left
  const shiftedLabels = new Map<string, RequirementStatus>()
  for (const label of ['핵심전공', '심화전공']) {
    const item = all.find((i) => i.label === label)
    if (!item || left === 0) continue
    const out = Math.min(Math.max(item.earned - item.credits, 0), left)
    left -= out
    if (out > 0) shiftedLabels.set(label, withEarned(item, item.earned - out, -out))
  }
  shiftedLabels.set(target.label, withEarned(target, target.earned + moved, moved))
  return groups.map((g) => ({
    ...g,
    items: g.items.map((i) => shiftedLabels.get(i.label) ?? i),
  }))
}

/** 영역 기준을 모두 채우려면 더 들어야 하는 학점 (못 들은 필수 과목 포함, 졸업 학점 130 이상) */
export function calcRemainingCredits(
  grades: Grade[],
  groups: { items: RequirementStatus[] }[],
) {
  const items = groups.flatMap((g) => g.items)
  const areaRemaining = items.reduce((sum, i) => sum + i.remaining, 0)
  // 학점은 채웠지만 필수 과목이 남은 영역은 그 과목 학점(3학점 가정)만큼 더 들어야 함
  const requiredExtra = calcRequiredCourses(grades)
    .filter((c) => !c.done && !c.inProgress)
    .filter((c) => items.some((i) => i.categories.includes(c.category) && i.remaining === 0))
    .length * 3
  const earned = calcEarnedCredits(grades)
  return Math.max(areaRemaining + requiredExtra, REQUIREMENTS.totalCredits - earned)
}

/** 남은 정규학기 수 (4학년 2학기 + 추가학기까지, 지금까지 다닌 학기 수 기준) */
export const remainingSemesters = (grades: Grade[], extraSemesters = 0) =>
  Math.max(8 + extraSemesters - countRegularSemesters(grades), 0)

/** 성적이 있는 정규학기(1·2학기) 수 */
export function countRegularSemesters(grades: Grade[]) {
  return new Set(
    grades
      .filter((g) => g.semester === '1학기' || g.semester === '2학기')
      .map((g) => `${g.year}-${g.semester}`),
  ).size
}
