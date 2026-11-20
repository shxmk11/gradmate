import { useEffect, useMemo, useState } from 'react'
import { db, type CareerState, type Grade } from '../db/database'
import { JOBS, skillName } from '../data/career'
import { getFreeTrackCase } from '../data/requirements'
import PlanSummary from '../components/PlanSummary'
import {
  calcSkills,
  courseTiming,
  recommendNextSemester,
  type NextCourse,
  type SemesterSlot,
  slotLabel,
  upcomingSemesters,
} from '../utils/career'
import { loadCareer } from '../utils/graduation'

const EMPTY: CareerState = { key: 'career', targetJobId: null, manualSkills: [], plan: [] }

const card = 'rounded-2xl border border-gray-200 bg-white p-6'

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {desc && <p className="mt-1 text-sm text-gray-500">{desc}</p>}
    </div>
  )
}

// 학기별 수강 계획: 학기를 고르고 추천 과목을 담아요 (설정의 내 계획 기준)
function Plan() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [state, setState] = useState<CareerState>(EMPTY)
  const [slotPick, setSlotPick] = useState<string | null>(null)

  useEffect(() => {
    db.grades.toArray().then(setGrades)
    loadCareer().then((saved) => saved && setState(saved))
  }, [])

  const save = (next: Partial<CareerState>) => {
    const merged = { ...state, ...next }
    setState(merged)
    db.career.put(merged)
  }

  const job = JOBS.find((j) => j.id === state.targetJobId) ?? null
  const freeTrack = getFreeTrackCase(state.freeTrackCase)
  const skills = useMemo(() => calcSkills(grades, state.manualSkills), [grades, state.manualSkills])
  const slots = upcomingSemesters(grades, state.extraSemesters ?? 0)
  const planned = new Set(state.plan.map((p) => p.courseName))
  // 보고 있는 학기 (기본은 다음 학기)
  const sel = slots.find((s) => slotLabel(s) === slotPick) ?? slots[0]
  const selLabel = slotLabel(sel)
  const selCourses = recommendNextSemester(job, skills, grades, sel, freeTrack.tracks)
  const planOf = (slot: SemesterSlot) =>
    state.plan.filter((p) => p.level === slot.level && p.semester === slot.semester)
  const selPlan = planOf(sel)
  const selAvailable = selCourses.filter((c) => !planned.has(c.course.name))
  // 그 학기 학년 (추가학기는 4학년 과목 기준)
  const selYear = Math.min(sel.level, 4)
  // 그 학년 과목(권장 학년이 없는 부전공 과목 포함)과 아직 안 들은 졸업 필수 과목만 추천, 나머지는 접기
  const isSuggested = (c: NextCourse) => c.required || c.onTrack || c.course.year === null
  const selSuggest = selAvailable.filter(isSuggested)
  const selOthers = selAvailable.filter((c) => !isSuggested(c))

  const addToPlan = (courseName: string, label: string) => {
    const slot = slots.find((s) => slotLabel(s) === label)
    if (!slot || planned.has(courseName)) return
    save({ plan: [...state.plan, { courseName, ...slot }] })
  }

  const removeFromPlan = (courseName: string) =>
    save({ plan: state.plan.filter((p) => p.courseName !== courseName) })

  const renderCourseItem = ({ course, required, key, fills, early, onTrack }: NextCourse) => (
    <li
      key={course.name}
      className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="mr-1 font-medium text-gray-900">{course.name}</p>
          {required && (
            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">
              졸업 필수
            </span>
          )}
          {key && (
            <span className="rounded-full border border-violet-200 px-2 py-0.5 text-xs font-medium text-violet-600">
              직무 핵심 과목
            </span>
          )}
          {onTrack && (
            <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
              {course.year}학년 권장
            </span>
          )}
          {fills.map((id) => (
            <span
              key={id}
              className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700"
            >
              + {skillName(id)}
            </span>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {course.group} · {courseTiming(course)}
          {early && ' · 권장 학년보다 일러요'}
        </p>
        {course.topics.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {course.topics.map((t) => (
              <span key={t} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => addToPlan(course.name, selLabel)}
        className="h-9 shrink-0 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700"
      >
        담기
      </button>
    </li>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-violet-600">GRADMATE</p>
        <h1 className="mt-2 text-3xl font-bold">수강 계획</h1>
        <p className="mt-2 text-gray-500">
          학기를 고르면 그 학기에 들을 만한 과목을 추천해요. 담은 과목은 졸업 요건 예상 학점에 반영돼요.
        </p>
      </header>

      <PlanSummary />

      <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const label = slotLabel(slot)
          const count = planOf(slot).length
          const active = label === selLabel
          return (
            <button
              key={label}
              type="button"
              onClick={() => setSlotPick(label)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'border-violet-400 bg-violet-50 text-violet-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
              {slot === slots[0] && <span className="ml-1 text-xs text-gray-400">다음 학기</span>}
              {count > 0 && <span className="ml-1.5 text-xs text-violet-500">{count}</span>}
            </button>
          )
        })}
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            title={`${selLabel}에 담은 과목`}
            desc="아래 추천에서 담은 과목이에요. 위에서 학기를 바꾸면 그 학기 계획을 볼 수 있어요."
          />
          <span className="text-sm text-gray-500">
            {selPlan.length}과목 · 약{' '}
            <span className="font-bold text-violet-700">{selPlan.length * 3}학점</span>
          </span>
        </div>
        {selPlan.length === 0 ? (
          <p className="mt-5 text-sm text-gray-400">아직 담은 과목이 없어요.</p>
        ) : (
          <ul className="mt-5 flex flex-wrap gap-2">
            {selPlan.map((p) => (
              <li
                key={p.courseName}
                className="flex items-center gap-2 rounded-full bg-violet-50 py-1.5 pr-2 pl-3.5 text-sm text-violet-700"
              >
                {p.courseName}
                <button
                  type="button"
                  onClick={() => removeFromPlan(p.courseName)}
                  className="rounded-full px-1.5 text-xs text-violet-400 hover:bg-violet-100 hover:text-violet-700"
                  aria-label={`${p.courseName} 빼기`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <SectionTitle
          title={`${selLabel} 추천 과목`}
          desc={`${selLabel}에 열리는 ${selYear}학년 과목 중 아직 안 들은 과목이에요. 졸업 필수 과목, ${
            job ? `${job.name} 핵심 과목, 부족한 역량` : '권장 학년'
          } 순서로 보여 줘요. ${freeTrack.label} 과목도 함께 추천하고, 다른 학년 과목은 아래 「그 외」에 있어요.`}
        />
        {!job && (
          <p className="mt-3 text-xs text-violet-600">
            설정의 「내 계획」에서 희망 직무를 고르면 직무에 맞춰 추천해요.
          </p>
        )}
        {selSuggest.length === 0 ? (
          <p className="mt-5 text-sm text-gray-400">추천할 과목이 없어요.</p>
        ) : (
          <ul className="mt-5 divide-y divide-gray-100">
            {selSuggest.map(renderCourseItem)}
          </ul>
        )}
        {selOthers.length > 0 && (
          <details className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-600">
              그 외 {selLabel}에 열리는 과목 ({selOthers.length})
            </summary>
            <ul className="mt-2 divide-y divide-gray-100">
              {selOthers.map(renderCourseItem)}
            </ul>
          </details>
        )}
        <p className="mt-4 text-xs text-gray-400">
          개설 학기는 학부 홈페이지 「학년별 교육과정」·로드맵 기준이에요. 실제 개설 여부와 시간표는 수강편람에서 확인해 주세요.
        </p>
      </section>
    </div>
    </div>
  )
}

export default Plan
