import { useEffect, useState } from 'react'
import { db, type Grade } from '../db/database'
import { REQUIREMENTS } from '../data/requirements'
import { calcGpa } from '../utils/gpa'
import {
  calcRequiredCourses,
  calcRequirementStatus,
  calcTotalProgress,
  countRegularSemesters,
} from '../utils/graduation'

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

  useEffect(() => {
    db.grades.toArray().then(setGrades)
  }, [])

  const total = calcTotalProgress(grades)
  const gpa = calcGpa(grades)
  const semesters = countRegularSemesters(grades)
  const requiredCourses = calcRequiredCourses(grades)
  const missingCourses = requiredCourses.filter((c) => !c.done)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-violet-600">GRADMATE</p>
        <h1 className="mt-2 text-3xl font-bold">졸업 요건</h1>
        <p className="mt-2 text-gray-500">{REQUIREMENTS.title} 기준</p>
      </header>

      {/* 전체 진행률 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">전체 졸업 학점</h2>
            <p className="mt-1 text-sm text-gray-500">
              졸업까지 {total.remaining}학점 남음
            </p>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">{total.earned}</span>
            <span className="mb-1 text-sm text-gray-400">/ {total.total}학점</span>
          </div>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-violet-600"
            style={{ width: `${total.percent}%` }}
          />
        </div>
        <p className="mt-3 text-right text-sm font-medium text-violet-600">
          {total.percent.toFixed(1)}%
        </p>
      </section>

      {/* 영역별 이수 현황 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">영역별 이수 현황</h2>
        <p className="mt-1 text-sm text-gray-500">
          각 영역의 기준 학점을 모두 채워야 졸업할 수 있어요.
        </p>

        <div className="mt-6 space-y-8">
          {REQUIREMENTS.groups.map((group) => {
            const items = group.items.map((item) =>
              calcRequirementStatus(grades, item),
            )
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
                    const done = item.remaining === 0 && areasOk

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
                            {item.remaining > 0 && (
                              <span className="ml-2 text-gray-400">
                                ({item.remaining}학점 남음)
                              </span>
                            )}
                          </span>
                        </div>
                        <ProgressBar percent={(item.earned / item.credits) * 100} />
                        {(item.note || item.minAreas) && (
                          <p className="mt-2 text-xs text-gray-400">
                            {item.note}
                            {item.minAreas !== undefined && (
                              <>
                                이수 영역 {item.areas.length} / {item.minAreas}개 이상
                                {item.areas.length > 0 && ` · ${item.areas.join(', ')}`}
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
              <StatusBadge done={course.done} label={course.done ? '이수' : '미이수'} />
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
