import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PlanSummary from '../components/PlanSummary'
import { MAJOR_SELECTION } from '../data/career'
import { db, type PlannedCourse, type Grade } from '../db/database'
import { calcPlannedCredits } from '../utils/career'
import {
  REQUIREMENTS,
  getFreeTrackCase,
  type FreeTrackPlan,
} from '../data/requirements'
import { IN_PROGRESS, calcGpa, earnedGrades, inProgressGrades } from '../utils/gpa'
import {
  calcAreaRemaining,
  calcExcessMajorCredits,
  calcGroupStatuses,
  calcRemainingCredits,
  calcRequiredCourses,
  calcTotalProgress,
  countRegularSemesters,
  loadCareer,
  normalize,
  remainingSemesters,
} from '../utils/graduation'

// planned: 수강 계획까지 들었을 때의 예상 진행률 (연한 색으로 이어서 표시)
function ProgressBar({ percent, planned = 0 }: { percent: number; planned?: number }) {
  const done = Math.min(percent, 100)
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-violet-500" style={{ width: `${done}%` }} />
      {planned > 0 && (
        <div
          className="h-full rounded-r-full bg-violet-200"
          style={{ width: `${Math.min(planned, 100 - done)}%` }}
        />
      )}
    </div>
  )
}

function StatusBadge({ done, label }: { done: boolean; label?: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        done ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {label ?? (done ? '충족' : '미충족')}
    </span>
  )
}

function Graduation() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [plan, setPlan] = useState<PlannedCourse[]>([])
  const [trackCase, setTrackCase] = useState<string | null>(null)
  const [extra, setExtra] = useState(0)
  const [shift, setShift] = useState(false)

  useEffect(() => {
    db.grades.toArray().then(setGrades)
    loadCareer().then((saved) => {
      if (!saved) return
      setPlan(saved.plan)
      setTrackCase(saved.freeTrackCase ?? null)
      setExtra(saved.extraSemesters ?? 0)
      setShift(saved.shiftExcess ?? false)
    })
  }, [])

  const groupStatuses = calcGroupStatuses(grades, trackCase, shift)
  const remaining = calcRemainingCredits(grades, groupStatuses)
  const areaRemaining = calcAreaRemaining(grades, groupStatuses)
  const semestersLeft = remainingSemesters(grades, extra)
  const excess = calcExcessMajorCredits(grades)
  const canShift = getFreeTrackCase(trackCase).tracks.includes('ce') && excess > 0

  // 설정에서 고른 자유선택 과정
  const selectedCase = getFreeTrackCase(trackCase)
  // 이름이 같은 과목을 들었는지 (F 제외, 수강 중 포함)
  const takenStatus = new Map(
    earnedGrades(grades).map((g) => [
      normalize(g.courseName),
      g.grade === IN_PROGRESS ? '수강 중' : '이수',
    ]),
  )

  const total = calcTotalProgress(grades)
  const gpa = calcGpa(grades)
  const semesters = countRegularSemesters(grades)
  const requiredCourses = calcRequiredCourses(grades)
  const missingCourses = requiredCourses.filter((c) => !c.done)
  const planned = calcPlannedCredits(plan, grades)
  const remainingWithPlan = Math.max(total.remaining - planned.total, 0)
  // 영역별 기준 합계와, 영역 기준만 채웠을 때 졸업 학점
  const groupSums = groupStatuses.map((g) => ({
    name: g.name,
    total: g.items.reduce((sum, i) => sum + i.credits, 0),
    counted: g.items.reduce((sum, i) => sum + Math.min(i.earned, i.credits), 0),
  }))
  const areaTotal = groupSums.reduce((sum, g) => sum + g.total, 0)
  const areaCounted = groupSums.reduce((sum, g) => sum + g.counted, 0)
  const outsideCredits = Math.max(total.earned - areaCounted, 0)
  const projectedTotal = total.earned + areaRemaining
  const overTotal = projectedTotal - total.total
  const inProgress = inProgressGrades(grades)
  const inProgressCredits = inProgress.reduce((sum, g) => sum + g.credits, 0)
  const inProgressOf = (categories: readonly string[]) =>
    inProgress
      .filter((g) => g.category && categories.includes(g.category))
      .reduce((sum, g) => sum + g.credits, 0)
  // 영역에 들어가는 필수 과목 중 아직 안 들은 것
  const missingRequiredOf = (categories: readonly string[]) =>
    requiredCourses.filter((c) => !c.done && categories.includes(c.category))
  const plannedOf = (categories: readonly string[]) =>
    categories.reduce(
      (sum, c) => sum + (planned.byCategory[c as keyof typeof planned.byCategory] ?? 0),
      0,
    )

  const renderTrackPlan = (p: FreeTrackPlan) => {
    const all = [...new Set(p.rows.flatMap((r) => [...r.first, ...r.second]))]
    const takenCount = all.filter((name) => takenStatus.has(normalize(name))).length
    return (
      <div key={p.id}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-bold text-gray-900">
            {p.name}
            {p.kind && <span className="ml-1 font-medium text-gray-500">{p.kind}</span>}
          </h3>
          <span className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{p.credits}학점</span>
            <span className="ml-2 text-gray-400">{p.detail}</span>
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-400">이수 기준</p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {p.rules.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-gray-400">신청</p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {p.apply.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-gray-400">개설 과목</p>
          {takenCount > 0 && (
            <p className="text-xs text-violet-600">이름이 같은 과목 {takenCount}개를 들었거나 듣는 중이에요</p>
          )}
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-500">
              <tr>
                <th className="w-24 p-2 font-medium" />
                <th className="p-2 font-medium">1학기</th>
                <th className="p-2 font-medium">2학기</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-100 align-top">
                  <td className="p-2 whitespace-nowrap text-gray-500">{row.label}</td>
                  {[row.first, row.second].map((list, i) => (
                    <td key={i} className="p-2">
                      <div className="flex flex-wrap gap-1.5">
                        {list.map((name) => {
                          const status = takenStatus.get(normalize(name))
                          return (
                            <span
                              key={name}
                              className={`rounded-md px-2 py-0.5 text-xs ${
                                status
                                  ? 'bg-violet-50 font-medium text-violet-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {name}
                              {status && ` · ${status}`}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">{p.courseNote}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-violet-600">GRADMATE</p>
        <h1 className="mt-2 text-3xl font-bold">졸업 요건</h1>
        <p className="mt-2 text-gray-500">{REQUIREMENTS.title} 기준</p>
      </header>

      <PlanSummary />

      {/* 전체 진행률 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">전체 졸업 학점</h2>
            <p className="mt-1 text-sm text-gray-500">
              졸업까지 {total.remaining}학점 남음
              {inProgressCredits > 0 && ` · 수강 중 ${inProgressCredits}학점 포함`}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              영역 기준을 다 채우려면 앞으로{' '}
              <span className="font-medium text-gray-900">{remaining}학점</span>
              {semestersLeft > 0 && (
                <>
                  {' '}· 남은 {semestersLeft}학기{extra > 0 && `(추가학기 ${extra} 포함)`}면 학기당 약{' '}
                  <span className="font-medium text-violet-700">
                    {Math.ceil(remaining / semestersLeft)}학점
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">{total.earned}</span>
            <span className="mb-1 text-sm text-gray-400">/ {total.total}학점</span>
          </div>
        </div>
        <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-violet-600"
            style={{ width: `${total.percent}%` }}
          />
          {planned.total > 0 && (
            <div
              className="h-full rounded-r-full bg-violet-200"
              style={{
                width: `${Math.min((planned.total / total.total) * 100, 100 - total.percent)}%`,
              }}
            />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gray-500">
            {planned.total > 0 ? (
              <>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-violet-200" />
                수강 계획 {planned.count}과목(약 {planned.total}학점)을 들으면 졸업까지{' '}
                {remainingWithPlan}학점 남아요.
              </>
            ) : (
              '진로 관리에서 수강 계획을 담으면 예상 학점이 함께 표시돼요.'
            )}
          </span>
          <span className="font-medium text-violet-600">{total.percent.toFixed(1)}%</span>
        </div>
      </section>

      {/* 영역별 이수 현황 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">영역별 이수 현황</h2>
        <p className="mt-1 text-sm text-gray-500">
          각 영역의 기준 학점을 모두 채워야 졸업할 수 있어요.
        </p>
        {shift && canShift && (
          <p className="mt-3 text-xs text-violet-600">
            주전공 기준을 넘긴 {excess}학점을 컴공 복수전공으로 옮겨서 계산하고 있어요. 설정의 「내 계획」에서 끌 수 있어요.
          </p>
        )}

        <div className="mt-6 space-y-8">
          {groupStatuses.map((group) => {
            const items = group.items
            const groupEarned = items.reduce(
              (sum, i) => sum + Math.min(i.earned, i.credits),
              0,
            )
            const groupTotal = items.reduce((sum, i) => sum + i.credits, 0)

            return (
              <div key={group.name}>
                <div className="mb-4 flex items-baseline justify-between">
                  <h3 className="font-bold text-gray-900">{group.name}</h3>
                  <span className="text-sm text-gray-500">
                    {groupEarned} / {groupTotal}학점
                  </span>
                </div>

                <div className="space-y-5">
                  {items.map((item) => {
                    const areasOk =
                      item.minAreas === undefined ||
                      item.areas.length >= item.minAreas
                    const missingRequired = missingRequiredOf(item.categories)
                    const done = item.remaining === 0 && areasOk && missingRequired.length === 0
                    const inProgressHere = inProgressOf(item.categories)
                    const plannedHere = plannedOf(item.categories)

                    return (
                      <div key={item.label}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              {item.label}
                            </span>
                            <StatusBadge done={done} />
                          </div>
                          <span className="text-gray-500">
                            {item.earned} / {item.credits}학점
                            {item.shifted ? (
                              <span className="ml-1 text-violet-500">
                                ({item.shifted > 0 ? `+${item.shifted}` : item.shifted} 옮김)
                              </span>
                            ) : null}
                            {inProgressHere > 0 && (
                              <span className="ml-1 text-gray-400">
                                (수강 중 {inProgressHere} 포함)
                              </span>
                            )}
                            {plannedHere > 0 && (
                              <span className="ml-2 text-violet-500">
                                (예상 +{plannedHere})
                              </span>
                            )}
                            {item.remaining > 0 && (
                              <span className="ml-2 text-gray-400">
                                ({item.remaining}학점 남음)
                              </span>
                            )}
                          </span>
                        </div>
                        <ProgressBar
                          percent={(item.earned / item.credits) * 100}
                          planned={(plannedHere / item.credits) * 100}
                        />
                        {missingRequired.length > 0 && (
                          <p className="mt-2 text-xs text-violet-600">
                            {item.remaining === 0
                              ? '학점은 채웠지만 필수 과목이 남았어요: '
                              : '남은 필수 과목: '}
                            {missingRequired
                              .map((c) => `${c.name}${c.inProgress ? ' (수강 중)' : ' (미이수)'}`)
                              .join(', ')}
                          </p>
                        )}
                        {(item.note || item.minAreas) && (
                          <p className="mt-2 text-xs text-gray-400">
                            {item.note}
                            {item.minAreas !== undefined && (
                              <>
                                이수 영역 {item.areas.length} / {item.minAreas}개 이상
                                {!areasOk &&
                                  item.areaOptions &&
                                  ` · 아직 안 들은 영역: ${item.areaOptions
                                    .filter((a) => !item.areas.includes(a))
                                    .join(', ')}`}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* 영역 합계와 졸업 학점 예상 */}
        <div className="mt-8 rounded-xl bg-gray-50 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-bold text-gray-900">총 학점</h3>
            <span className="text-sm text-gray-500">
              영역 기준 합계{' '}
              <span className="font-medium text-gray-900">{areaTotal}학점</span>
            </span>
          </div>
          <ul className="mt-3 divide-y divide-gray-200 text-sm">
            {groupSums.map((g) => (
              <li key={g.name} className="flex items-center justify-between gap-4 py-2">
                <span className="text-gray-600">{g.name}</span>
                <span className="text-gray-500">
                  {g.counted} / {g.total}학점
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 py-2">
              <span className="text-gray-600">영역 기준을 넘긴 학점 · 일반선택</span>
              <span className="text-gray-500">{outsideCredits}학점</span>
            </li>
            <li className="flex items-center justify-between gap-4 py-2 font-medium">
              <span className="text-gray-900">지금까지 이수</span>
              <span className="text-gray-900">
                {total.earned} / {total.total}학점
              </span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            이대로 영역 기준만 딱 채우면 앞으로{' '}
            <span className="font-medium text-gray-900">{areaRemaining}학점</span>을 더 들어서
            졸업 때 약{' '}
            <span className="font-medium text-violet-700">{projectedTotal}학점</span>이 돼요.{' '}
            {overTotal > 0
              ? `졸업 기준 ${total.total}학점보다 ${overTotal}학점 많아요.`
              : overTotal < 0
                ? `졸업 기준 ${total.total}학점까지 ${-overTotal}학점은 아무 과목으로나 더 채우면 돼요.`
                : `졸업 기준 ${total.total}학점과 딱 맞아요.`}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            필수 과목이 남은 영역은 과목당 3학점으로 가정했어요. 수강 중인 과목은 이수한 것으로 셌어요.
          </p>
        </div>
      </section>

      {/* 자유선택 과정 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">자유선택 과정</h2>
            <p className="mt-1 text-sm text-gray-500">
              <Link to="/settings" className="font-medium text-violet-600 hover:underline">
                내 계획
              </Link>
              에서 고른 과정의 이수 기준, 신청 안내, 개설 과목이에요. 이수 학점은 위 「자유선택」에 있어요.
            </p>
          </div>
          <StatusBadge done={false} label={selectedCase.label} />
        </div>

        <div className="mt-6">
          {renderTrackPlan(selectedCase.plan)}
          {selectedCase.tracks.includes('ce') && (
            <details className="mt-6 rounded-xl bg-gray-50 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                {MAJOR_SELECTION.title} 안내 · 여석
              </summary>
              <p className="mt-3 text-sm text-gray-500">{MAJOR_SELECTION.rule}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
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
              <p className="mt-4 mb-1 text-sm font-medium text-gray-900">2025학번 여석</p>
              <ul className="divide-y divide-gray-100 text-sm">
                {MAJOR_SELECTION.seats2025.map((seat) => (
                  <li key={seat.name} className="flex justify-between py-2">
                    <span className={seat.name === '컴퓨터공학과' ? 'font-medium text-violet-700' : 'text-gray-700'}>
                      {seat.name}
                    </span>
                    <span className={seat.seats === 0 ? 'text-gray-400' : 'text-gray-900'}>
                      {seat.seats}명
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>

      {/* 필수 과목 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">필수 과목</h2>
            <p className="mt-1 text-sm text-gray-500">
              {missingCourses.length === 0
                ? '필수 과목을 모두 이수했어요.'
                : `${missingCourses.length}과목 남았어요.`}
            </p>
          </div>
          <span className="text-sm text-gray-500">
            {requiredCourses.length - missingCourses.length} / {requiredCourses.length}
          </span>
        </div>

        <ul className="mt-5 divide-y divide-gray-100">
          {requiredCourses.map((course) => (
            <li
              key={course.name}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-gray-900">{course.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {course.category} · {course.note}
                </p>
              </div>
              <StatusBadge
                done={course.done}
                label={course.done ? '이수' : course.inProgress ? '수강 중' : '미이수'}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* 기타 요건 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">기타 요건</h2>
        <ul className="mt-5 divide-y divide-gray-100 text-sm">
          <li className="flex items-center justify-between gap-4 py-3">
            <span className="text-gray-700">
              전 학년 평점평균 {REQUIREMENTS.minGpa.toFixed(1)} 이상
            </span>
            <span className="flex items-center gap-2 text-gray-500">
              {gpa !== null ? gpa.toFixed(2) : '-'}
              <StatusBadge done={gpa !== null && gpa >= REQUIREMENTS.minGpa} />
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 py-3">
            <span className="text-gray-700">
              {REQUIREMENTS.minSemesters}학기 이상 등록
            </span>
            <span className="flex items-center gap-2 text-gray-500">
              성적 기준 {semesters}학기
              <StatusBadge done={semesters >= REQUIREMENTS.minSemesters} />
            </span>
          </li>
          {REQUIREMENTS.otherRules.slice(2).map((rule) => (
            <li key={rule} className="py-3 text-gray-500">
              {rule}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-400">
          출처: {REQUIREMENTS.source}. 최종 확인은 성신포탈 졸업이수학점현황에서 해 주세요.
        </p>
      </section>
    </div>
  )
}

export default Graduation
