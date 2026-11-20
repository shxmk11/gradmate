import type { Category, Grade, PlannedCourse } from '../db/database'
import {
  COURSES,
  SKILLS,
  skillName,
  type CareerCourse,
  type Job,
  type SkillId,
  type Track,
} from '../data/career'
import { earnedGrades } from './gpa'
import { normalize } from './graduation'

/** 학점을 취득한 과목명 (정규화) */
export const takenCourseNames = (grades: Grade[]) =>
  new Set(earnedGrades(grades).map((g) => normalize(g.courseName)))

export interface SkillStatus {
  id: SkillId
  name: string
  /** 이 역량을 길러 준 이수 과목 */
  courses: string[]
  /** 직접 체크했는지 */
  manual: boolean
  owned: boolean
}

/** 이수 과목에서 자동 계산 + 직접 체크한 역량 */
export function calcSkills(grades: Grade[], manualSkills: string[]): SkillStatus[] {
  const taken = takenCourseNames(grades)
  return SKILLS.map(({ id, name }) => {
    const courses = COURSES.filter(
      (c) => c.skills.includes(id) && taken.has(normalize(c.name)),
    ).map((c) => c.name)
    const manual = manualSkills.includes(id)
    return { id, name, courses, manual, owned: courses.length > 0 || manual }
  })
}

export interface Recommendation {
  course: CareerCourse
  /** 이 과목이 채워 주는 부족 역량 */
  fills: SkillId[]
  /** 직무 핵심 과목인지 */
  key: boolean
  score: number
}

/** 희망 직무의 핵심 과목과 부족 역량을 채우는 미이수 과목 (점수 높은 순, 학년 낮은 순) */
export function recommendCourses(
  job: Job,
  skills: SkillStatus[],
  grades: Grade[],
): Recommendation[] {
  const owned = new Set(skills.filter((s) => s.owned).map((s) => s.id))
  const missingCore = job.core.filter((id) => !owned.has(id))
  const missingNice = job.nice.filter((id) => !owned.has(id))
  const taken = takenCourseNames(grades)

  return COURSES.filter((course) => !taken.has(normalize(course.name)))
    .map((course) => {
      const core = course.skills.filter((s) => missingCore.includes(s))
      const nice = course.skills.filter((s) => missingNice.includes(s))
      const key = job.keyCourses.includes(course.name)
      return {
        course,
        fills: [...core, ...nice],
        key,
        score: core.length * 2 + nice.length + (key ? 3 : 0),
      }
    })
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(!!a.course.dept) - Number(!!b.course.dept) ||
        (a.course.year ?? 9) - (b.course.year ?? 9),
    )
}

export interface TrackGroupStatus {
  label: string
  done: string[]
  remaining: string[]
  need: number
  pick?: number
}

/** 트랙별 이수 현황 (과목 수 기준) */
export function calcTrackStatus(track: Track, grades: Grade[]) {
  const taken = takenCourseNames(grades)
  const groups: TrackGroupStatus[] = track.groups.map((g) => {
    const done = g.courses.filter((name) => taken.has(normalize(name)))
    return {
      label: g.label,
      done,
      remaining: g.courses.filter((name) => !taken.has(normalize(name))),
      need: g.pick ?? g.courses.length,
      pick: g.pick,
    }
  })
  const need = groups.reduce((sum, g) => sum + g.need, 0)
  const done = groups.reduce((sum, g) => sum + Math.min(g.done.length, g.need), 0)
  return { groups, need, done, percent: (done / need) * 100 }
}

export interface SemesterSlot {
  year: number
  semester: '1학기' | '2학기'
}

export const slotLabel = (s: SemesterSlot) => `${s.year}-${s.semester === '1학기' ? 1 : 2}학기`

/**
 * 계획을 세울 수 있는 학기: 다음 학기부터 졸업 학기(입학년도 + 3년의 2학기)까지.
 * 입학년도는 가장 이른 성적의 연도로 추정.
 */
export function upcomingSemesters(grades: Grade[], now = new Date()): SemesterSlot[] {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  // 다음에 수강신청할 학기부터: 1~2월은 그해 1학기, 3~8월은 그해 2학기, 9~12월은 다음 해 1학기
  let current: SemesterSlot =
    month <= 2
      ? { year, semester: '1학기' }
      : month <= 8
        ? { year, semester: '2학기' }
        : { year: year + 1, semester: '1학기' }
  const admission = grades.length > 0 ? Math.min(...grades.map((g) => g.year)) : year
  const last = Math.max(admission + 3, current.year)

  const slots: SemesterSlot[] = []
  while (current.year <= last) {
    slots.push(current)
    current =
      current.semester === '1학기'
        ? { year: current.year, semester: '2학기' }
        : { year: current.year + 1, semester: '1학기' }
  }
  return slots
}

/** 과목 개설 학기에 맞는 계획 학기 */
export const slotsForCourse = (course: CareerCourse, slots: SemesterSlot[]) =>
  slots.filter(
    (s) => !course.term || course.term === '매학기' || course.term === s.semester,
  )

export const courseTiming = (course: CareerCourse) => {
  if (!course.year && !course.term) return '개설 시기 확인 필요'
  const parts = []
  if (course.year) parts.push(`${course.year}학년`)
  if (course.term) parts.push(course.term === '매학기' ? '매학기' : course.term)
  return parts.join(' ')
}

/** 계획을 학기 순으로 묶기 */
export function groupPlan(plan: PlannedCourse[]) {
  const map = new Map<string, { slot: SemesterSlot; courses: string[] }>()
  for (const p of [...plan].sort(
    (a, b) => a.year - b.year || a.semester.localeCompare(b.semester),
  )) {
    const key = slotLabel(p)
    if (!map.has(key)) map.set(key, { slot: { year: p.year, semester: p.semester }, courses: [] })
    map.get(key)!.courses.push(p.courseName)
  }
  return [...map.values()]
}

interface PromptInput {
  job: Job | null
  skills: SkillStatus[]
  gpa: number | null
  earned: number
  totalCredits: number
  remainingAreas: string[]
  missingRequired: string[]
  plan: PlannedCourse[]
  courseNames: string[]
}

/** AI 진로 상담용 질문 만들기 (복사해서 원하는 AI에 붙여 넣기) */
export function buildCounselPrompt(p: PromptInput) {
  const owned = p.skills.filter((s) => s.owned).map((s) => s.name)
  const lines = [
    '저는 성신여대 AI융합학부 AI전공 2025학번 학생이에요. 아래 제 정보를 보고 진로 상담을 해 주세요.',
    '',
    '[학업 현황]',
    `- 누적 평점: ${p.gpa !== null ? p.gpa.toFixed(2) : '-'} / 4.5`,
    `- 취득 학점: ${p.earned} / ${p.totalCredits}학점`,
    `- 들은 과목: ${p.courseNames.join(', ') || '없음'}`,
    `- 남은 졸업 요건: ${p.remainingAreas.join(', ') || '없음'}`,
    `- 아직 안 들은 필수 과목: ${p.missingRequired.join(', ') || '없음'}`,
    '- 자유선택 과정(전공심화·부전공·복수전공·융합연계전공): 아직 안 정함',
    '',
    '[역량]',
    `- 갖춘 역량: ${owned.join(', ') || '없음'}`,
  ]
  if (p.job) {
    const missing = [...p.job.core, ...p.job.nice]
      .filter((id) => !p.skills.find((s) => s.id === id)?.owned)
      .map(skillName)
    lines.push(
      '',
      '[희망 직무]',
      `- ${p.job.name} (${p.job.work})`,
      `- 부족한 역량: ${missing.join(', ') || '없음'}`,
    )
  }
  if (p.plan.length > 0) {
    lines.push('', '[수강 계획]')
    for (const g of groupPlan(p.plan)) lines.push(`- ${slotLabel(g.slot)}: ${g.courses.join(', ')}`)
  }
  lines.push(
    '',
    '[질문]',
    p.job
      ? `1. ${p.job.name}가 되려면 남은 학기에 무엇을 우선해서 준비하면 좋을까요?`
      : '1. 제 역량으로 어떤 AI 관련 직무가 잘 맞을까요?',
    '2. 수강 계획에서 바꾸거나 더하면 좋은 과목이 있을까요?',
    '3. 자유선택 과정은 무엇을 고르면 좋을까요?',
    '4. 수업 외에 준비하면 좋은 프로젝트, 자격증, 대외활동을 알려 주세요.',
  )
  return lines.join('\n')
}

/** 로드맵 영역 → 졸업 요건 영역 (트랙 과목·타 학과는 영역을 알 수 없어서 전체 학점에만 반영) */
const GROUP_CATEGORY: Record<string, Category> = {
  교양필수: '공통교양',
  '1영역': '핵심전공',
  '2영역': '핵심전공',
  '3영역': '심화전공',
  '4영역': '심화전공',
}

/** 아직 안 들은 계획 과목의 예상 학점 (과목당 3학점으로 가정) */
export function calcPlannedCredits(plan: PlannedCourse[], grades: Grade[]) {
  const taken = takenCourseNames(grades)
  const courses = plan
    .filter((p) => !taken.has(normalize(p.courseName)))
    .map((p) => {
      const course = COURSES.find((c) => normalize(c.name) === normalize(p.courseName))
      return { name: p.courseName, credits: 3, category: course ? GROUP_CATEGORY[course.group] : undefined }
    })
  const byCategory: Partial<Record<Category, number>> = {}
  for (const c of courses) if (c.category) byCategory[c.category] = (byCategory[c.category] ?? 0) + c.credits
  return { courses, total: courses.reduce((sum, c) => sum + c.credits, 0), byCategory }
}
