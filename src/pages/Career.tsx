import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db, type CareerState, type Grade } from '../db/database'
import { JOBS, MAJOR_SELECTION, TRACKS, skillName, type SkillId } from '../data/career'
import { REQUIREMENTS, type CreditRequirement } from '../data/requirements'
import { calcEarnedCredits, calcGpa, completedGrades } from '../utils/gpa'
import { calcRequiredCourses, calcRequirementStatus } from '../utils/graduation'
import {
  buildCounselPrompt,
  calcSkills,
  calcTrackStatus,
  courseTiming,
  recommendNextSemester,
  type NextCourse,
  type SemesterSlot,
  slotLabel,
  upcomingSemesters,
} from '../utils/career'

const EMPTY: CareerState = { key: 'career', targetJobId: null, manualSkills: [], plan: [] }

const card = 'rounded-2xl border border-gray-200 bg-white p-6'

const TABS = [
  { id: 'job', name: '직무·역량' },
  { id: 'plan', name: '수강 계획' },
  { id: 'track', name: '트랙·전공' },
  { id: 'ai', name: 'AI 상담' },
] as const
type TabId = (typeof TABS)[number]['id']

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-violet-500"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  )
}

function SkillChip({ id, owned }: { id: SkillId; owned: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        owned ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {skillName(id)}
    </span>
  )
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {desc && <p className="mt-1 text-sm text-gray-500">{desc}</p>}
    </div>
  )
}

function Career() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [state, setState] = useState<CareerState>(EMPTY)
  const [slotPick, setSlotPick] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // 탭을 주소(?tab=)에 담아서 새로고침·뒤로가기에도 유지
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: TabId = TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? 'job'
  const setTab = (id: TabId) => setSearchParams(id === 'job' ? {} : { tab: id })

  useEffect(() => {
    db.grades.toArray().then(setGrades)
    db.career.get('career').then((saved) => saved && setState(saved))
  }, [])

  const save = (next: Partial<CareerState>) => {
    const merged = { ...state, ...next }
    setState(merged)
    db.career.put(merged)
  }

  const job = JOBS.find((j) => j.id === state.targetJobId) ?? null
  const skills = useMemo(() => calcSkills(grades, state.manualSkills), [grades, state.manualSkills])
  const owned = (id: SkillId) => skills.find((s) => s.id === id)?.owned ?? false
  const slots = upcomingSemesters(grades)
  const planned = new Set(state.plan.map((p) => p.courseName))
  // 수강 계획 탭에서 보고 있는 학기 (기본은 다음 학기)
  const sel = slots.find((s) => slotLabel(s) === slotPick) ?? slots[0]
  const selLabel = slotLabel(sel)
  const selCourses = recommendNextSemester(job, skills, grades, sel)
  const planOf = (slot: SemesterSlot) =>
    state.plan.filter((p) => p.year === slot.year && p.semester === slot.semester)
  const selPlan = planOf(sel)
  const selAvailable = selCourses.filter((c) => !planned.has(c.course.name))
  // 졸업 필수·직무 핵심·부족 역량·그 학년 권장 과목이면 추천, 나머지는 접어서 보여 주기
  const isSuggested = (c: NextCourse) => c.required || c.key || c.fills.length > 0 || c.onTrack
  const selSuggest = selAvailable.filter(isSuggested)
  const selOthers = selAvailable.filter((c) => !isSuggested(c))

  const toggleManual = (id: string) =>
    save({
      manualSkills: state.manualSkills.includes(id)
        ? state.manualSkills.filter((s) => s !== id)
        : [...state.manualSkills, id],
    })

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

  const prompt = buildCounselPrompt({
    job,
    skills,
    gpa: calcGpa(grades),
    earned: calcEarnedCredits(grades),
    totalCredits: REQUIREMENTS.totalCredits,
    remainingAreas: REQUIREMENTS.groups
      .flatMap((g): CreditRequirement[] => g.items)
      .map((item) => calcRequirementStatus(grades, item))
      .filter((s) => s.remaining > 0)
      .map((s) => `${s.label} ${s.remaining}학점`),
    missingRequired: calcRequiredCourses(grades)
      .filter((c) => !c.done)
      .map((c) => c.name),
    plan: state.plan,
    courseNames: completedGrades(grades).map((g) => g.courseName),
  })

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-violet-600">GRADMATE</p>
        <h1 className="mt-2 text-3xl font-bold">진로 관리</h1>
        <p className="mt-2 text-gray-500">
          희망 직무를 고르면 필요한 역량, 부족한 역량, 들으면 좋은 과목을 보여 줘요.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          참고용이에요. 직무·역량 연결은 일반적인 기준이고, 과목 개설 시기는 2026 학부 로드맵 기준이라 매 학기 수강편람으로 확인해 주세요.
        </p>
      </header>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex w-fit flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>
          <span className="text-sm text-gray-500">
            희망 직무{' '}
            <span className="font-medium text-gray-900">{job ? job.name : '미정'}</span>
          </span>
        </div>

        {tab === 'job' && (
          <div className="space-y-8">
            {/* 직무 탐색 */}
            <section className={card}>
              <SectionTitle title="직무 탐색" desc="관심 있는 직무를 눌러 희망 직무로 정해 보세요." />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {JOBS.map((j) => {
                  const selected = j.id === state.targetJobId
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => save({ targetJobId: selected ? null : j.id })}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                        selected
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className={`font-bold ${selected ? 'text-violet-700' : 'text-gray-900'}`}>
                        {j.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{j.work}</p>
                    </button>
                  )
                })}
              </div>

              {job && (
                <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-5 text-sm">
                  <p className="font-bold text-gray-900">{job.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-16 shrink-0 text-gray-500">핵심 역량</span>
                    {job.core.map((id) => (
                      <SkillChip key={id} id={id} owned={owned(id)} />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-16 shrink-0 text-gray-500">우대 역량</span>
                    {job.nice.map((id) => (
                      <SkillChip key={id} id={id} owned={owned(id)} />
                    ))}
                  </div>
                  <p className="text-gray-600">
                    <span className="text-gray-500">잘 맞는 자유선택 과정 · </span>
                    {job.freeTrack}
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-500">준비 팁 · </span>
                    {job.tips}
                  </p>
                </div>
              )}
            </section>

            {/* 역량 분석 */}
            <section className={card}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionTitle
                  title="역량 분석"
                  desc="들은 과목으로 자동 계산해요. 수업 밖에서 익힌 역량은 직접 체크해 주세요."
                />
                {job && (
                  <span className="text-sm text-gray-500">
                    {job.name} 핵심 역량{' '}
                    <span className="font-bold text-violet-700">
                      {job.core.filter(owned).length} / {job.core.length}
                    </span>
                  </span>
                )}
              </div>

              <ul className="mt-5 divide-y divide-gray-100">
                {skills.map((s) => {
                  const role = job?.core.includes(s.id) ? '핵심' : job?.nice.includes(s.id) ? '우대' : null
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{s.name}</span>
                          {role && (
                            <span className="rounded-full border border-violet-200 px-2 py-0.5 text-xs text-violet-600">
                              {role}
                            </span>
                          )}
                          {role && !s.owned && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              부족
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {s.courses.length > 0 ? s.courses.join(', ') : '아직 들은 관련 과목 없음'}
                        </p>
                      </div>
                      <label className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={s.manual}
                          onChange={() => toggleManual(s.id)}
                          className="h-4 w-4 accent-violet-600"
                        />
                        직접 체크
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        )}

        {tab === 'plan' && (
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
                desc={`${selLabel}에 열리는 과목 중 아직 안 들은 과목이에요. 졸업 필수 과목, ${
                  job ? `${job.name} 핵심 과목, 부족한 역량, 권장 학년` : '권장 학년'
                } 순서로 보여 줘요.`}
              />
              {!job && (
                <p className="mt-3 text-xs text-violet-600">
                  직무·역량 탭에서 희망 직무를 고르면 직무에 맞춰 추천해요.
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
        )}

        {tab === 'track' && (
          <div className="space-y-8">
            {/* 트랙 */}
            <section className={card}>
              <SectionTitle
                title="AI융합학부 트랙"
                desc="트랙 과목을 기준 이상 들으면 성적증명서에 트랙명이 표시돼요."
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {TRACKS.map((track) => {
                  const status = calcTrackStatus(track, grades)
                  const fit = job && track.jobs.includes(job.id)
                  return (
                    <div
                      key={track.name}
                      className={`rounded-xl border p-5 ${fit ? 'border-violet-300' : 'border-gray-200'}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{track.name}</p>
                          {fit && (
                            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                              희망 직무와 맞음
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{track.credits}</span>
                      </div>
                      <ProgressBar percent={status.percent} />
                      <div className="mt-3 space-y-2 text-xs">
                        {status.groups.map((g) => (
                          <div key={g.label}>
                            <p className="text-gray-500">
                              {g.label} {Math.min(g.done.length, g.need)} / {g.need}과목
                              {g.pick && ` (${g.pick}과목 선택)`}
                            </p>
                            {g.done.length > 0 && (
                              <p className="mt-0.5 text-violet-700">이수: {g.done.join(', ')}</p>
                            )}
                            {g.done.length < g.need && (
                              <p className="mt-0.5 text-gray-400">남음: {g.remaining.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* 부·복수전공 선발 */}
            <section className={card}>
              <SectionTitle title={MAJOR_SELECTION.title} desc={MAJOR_SELECTION.rule} />
              <ul className="mt-5 space-y-1 text-sm text-gray-600">
                <li>
                  <span className="text-gray-500">신청 · </span>
                  {MAJOR_SELECTION.period}
                </li>
                <li>
                  <span className="text-gray-500">발표 · </span>
                  {MAJOR_SELECTION.announce}
                </li>
                <li>
                  <span className="text-gray-500">방법 · </span>
                  {MAJOR_SELECTION.how}
                </li>
              </ul>
              <p className="mt-5 mb-2 text-sm font-bold text-gray-900">2025학번 여석</p>
              <ul className="divide-y divide-gray-100 text-sm">
                {MAJOR_SELECTION.seats2025.map((s) => (
                  <li key={s.name} className="flex justify-between py-2">
                    <span className="text-gray-700">{s.name}</span>
                    <span className={s.seats === 0 ? 'text-gray-400' : 'text-gray-900'}>
                      {s.seats}명
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === 'ai' && (
          <div className="space-y-8">
            {/* AI 상담 질문 */}
            <section className={card}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionTitle
                  title="AI 진로 상담 질문"
                  desc="내 성적과 역량을 담은 질문이에요. 복사해서 ChatGPT나 Claude 같은 AI에 붙여 넣어 보세요."
                />
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700"
                >
                  {copied ? '복사했어요' : '질문 복사'}
                </button>
              </div>
              <pre className="mt-5 max-h-96 overflow-auto rounded-xl bg-gray-50 p-5 text-xs leading-relaxed whitespace-pre-wrap text-gray-700">
                {prompt}
              </pre>
            </section>
          </div>
        )}
      </div>

    </div>
  )
}

export default Career
