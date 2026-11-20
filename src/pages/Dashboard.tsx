
import { useEffect, useState } from 'react'
import GpaChart from '../components/GpaChart'
import { db, type Grade } from '../db/database'
import { REQUIREMENTS } from '../data/requirements'
import { calcRequirementStatus, calcTotalProgress } from '../utils/graduation'
import {
  GRADE_POINTS,
  IN_PROGRESS,
  calcEarnedCredits,
  calcGpa,
  calcSemesterGpas,
  toPercentage,
} from '../utils/gpa'

const Dashboard = () => {
  const [grades, setGrades] = useState<Grade[]>([])

  useEffect(() => {
    db.grades.toArray().then(setGrades)
  }, [])

  const gpa = calcGpa(grades)
  const gpaCredits = grades
    .filter((g) => g.grade in GRADE_POINTS)
    .reduce((sum, g) => sum + g.credits, 0)
  const earnedCredits = calcEarnedCredits(grades)
  const inProgressCredits = grades
    .filter((g) => g.grade === IN_PROGRESS)
    .reduce((sum, g) => sum + g.credits, 0)
  // 수강 중(성적 미정) 과목만 있는 학기는 그래프에서 제외
  const semesterGpas = calcSemesterGpas(grades.filter((g) => g.grade !== IN_PROGRESS))

  const total = calcTotalProgress(grades)

  // 졸업 요건 그룹(교양, 전공)별 진행률. 영역별 기준을 넘긴 학점은 그룹 진행률에 넣지 않음
  const groupProgress = REQUIREMENTS.groups.map((group) => {
    const items = group.items.map((item) => calcRequirementStatus(grades, item))
    const earned = items.reduce((sum, i) => sum + Math.min(i.earned, i.credits), 0)
    const required = items.reduce((sum, i) => sum + i.credits, 0)
    return {
      name: group.name,
      earned,
      required,
      percent: Math.min((earned / required) * 100, 100),
    }
  })

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <header>
        <p className="text-sm font-medium text-violet-600">
          GRADMATE
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          대시보드
        </h1>
        <p className="mt-2 text-gray-500">
          나의 학업 현황을 한눈에 확인해 보세요.
        </p>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">
            누적 평점
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {gpa !== null ? gpa.toFixed(2) : '-'}
            </span>
            <span className="mb-1 text-sm text-gray-400">/ 4.5</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {gpa !== null
              ? `백분율 ${toPercentage(gpa).toFixed(2)} · 평점 반영 ${gpaCredits}학점`
              : '등록된 성적이 없습니다.'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">
            취득 학점
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {earnedCredits}
            </span>
            <span className="mb-1 text-sm text-gray-400">
              / {total.total}학점
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            졸업까지 {total.remaining}학점 남음
            {inProgressCredits > 0 && ` · 수강 중 ${inProgressCredits}학점 포함`}
          </p>
        </div>
      </section>

      {/* GPA Chart */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              GPA 추이
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              학기별 및 누적 평점 변화
            </p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            4.5 만점
          </span>
        </div>

        {semesterGpas.length > 0 ? (
          <div className="mt-6">
            <GpaChart data={semesterGpas} />
          </div>
        ) : (
        <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-gray-50">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">
              아직 표시할 성적 추이 데이터가 없습니다.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              학기별 성적을 등록하면 그래프가 표시됩니다.
            </p>
          </div>
        </div>
        )}
      </section>

      {/* Graduation Progress */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              졸업 진행률
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              전체 졸업 학점 기준
            </p>
          </div>
          <span className="text-2xl font-bold text-violet-600">
            {total.percent.toFixed(1)}%
          </span>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{ width: `${total.percent}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-sm">
          <span className="font-medium text-gray-700">
            {total.earned}학점 취득
          </span>
          <span className="text-gray-400">목표 {total.total}학점</span>
        </div>

        <div className="mt-8 space-y-5">
          {groupProgress.map((group) => (
            <div key={group.name}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">{group.name}</span>
                <span className="text-gray-500">
                  {group.earned} / {group.required}학점 ({group.percent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${group.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
