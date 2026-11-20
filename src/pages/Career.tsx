import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db, type CareerState, type Grade } from '../db/database'
import { JOBS, TRACKS, skillName, type SkillId } from '../data/career'
import { REQUIREMENTS, getFreeTrackCase } from '../data/requirements'
import PlanSummary from '../components/PlanSummary'
import { calcEarnedCredits, calcGpa, completedGrades } from '../utils/gpa'
import { calcGroupStatuses, calcRequiredCourses, loadCareer } from '../utils/graduation'
import { buildCounselPrompt, calcSkills, calcTrackStatus } from '../utils/career'

const EMPTY: CareerState = { key: 'career', targetJobId: null, manualSkills: [], plan: [] }

const card = 'rounded-2xl border border-gray-200 bg-white p-6'

const TRACK_SHORT = { ce: '컴공', aiv: '영상' } as const

const TABS = [
  { id: 'job', name: '직무·역량' },
  { id: 'track', name: '트랙' },
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
  const [copied, setCopied] = useState(false)
  // 탭을 주소(?tab=)에 담아서 새로고침·뒤로가기에도 유지
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: TabId = TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? 'job'
  const setTab = (id: TabId) => setSearchParams(id === 'job' ? {} : { tab: id })

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
  // 대시보드에서 고른 자유선택 과정: 추천 과목과 직무 표시에 반영
  const freeTrack = getFreeTrackCase(state.freeTrackCase)
  // 고른 과정 중 이 직무와 잘 맞는 것 (컴공, 영상)
  const fitNames = (j: (typeof JOBS)[number]) =>
    j.fitTracks.filter((t) => freeTrack.tracks.includes(t)).map((t) => TRACK_SHORT[t])
  const trackKeyCourses = (j: (typeof JOBS)[number]) =>
    freeTrack.tracks.flatMap((t) => j.trackCourses[t] ?? [])
  const skills = useMemo(() => calcSkills(grades, state.manualSkills), [grades, state.manualSkills])
  const owned = (id: SkillId) => skills.find((s) => s.id === id)?.owned ?? false
  const toggleManual = (id: string) =>
    save({
      manualSkills: state.manualSkills.includes(id)
        ? state.manualSkills.filter((s) => s !== id)
        : [...state.manualSkills, id],
    })

  const prompt = buildCounselPrompt({
    job,
    skills,
    gpa: calcGpa(grades),
    earned: calcEarnedCredits(grades),
    totalCredits: REQUIREMENTS.totalCredits,
    freeTrack: freeTrack.label,
    remainingAreas: calcGroupStatuses(grades, state.freeTrackCase, state.shiftExcess)
      .flatMap((g) => g.items)
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
          직무별로 필요한 역량과 부족한 역량, 트랙 이수 현황을 보여 줘요.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          참고용이에요. 직무·역량 연결은 일반적인 기준이고, 과목 개설 시기는 2026 학부 로드맵 기준이라 매 학기 수강편람으로 확인해 주세요.
        </p>
      </header>

      <PlanSummary />

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
                      {fitNames(j).length > 0 && (
                        <span className="mt-1.5 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {fitNames(j).join(' · ')}과 잘 맞아요
                        </span>
                      )}
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
                  {trackKeyCourses(job).length > 0 && (
                    <p className="text-gray-600">
                      <span className="text-gray-500">{freeTrack.label}에서 추천 · </span>
                      {trackKeyCourses(job).join(', ')}
                    </p>
                  )}
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
                              <p className="mt-0.5 text-violet-700">
                                이수:{' '}
                                {g.done
                                  .map((name) => (g.inProgress.includes(name) ? `${name} (수강 중)` : name))
                                  .join(', ')}
                              </p>
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
