
import { useEffect, useState } from 'react'
import GpaChart from '../components/GpaChart'
import { CATEGORIES, db, type Grade } from '../db/database'
import {
  GRADE_POINTS,
  calcCreditsByCategory,
  calcEarnedCredits,
  calcGpa,
  calcSemesterGpas,
  toPercentage,
} from '../utils/gpa'

// 확정된 졸업 기준: 교양 33학점. 총 졸업학점은 아직 미확정.
const LIBERAL_ARTS_REQUIRED = 33
const LIBERAL_ARTS_CATEGORIES = ['공통교양', '핵심교양', '진로소양'] as const

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
  const semesterGpas = calcSemesterGpas(grades)
  const byCategory = calcCreditsByCategory(grades)

  const liberalArtsCredits = LIBERAL_ARTS_CATEGORIES.reduce(
    (sum, c) => sum + byCategory[c],
    0,
  )
  const liberalArtsProgress = Math.min(
    (liberalArtsCredits / LIBERAL_ARTS_REQUIRED) * 100,
    100,
  )

  const creditCategories = [
    ...CATEGORIES.map((name) => ({ name, credits: byCategory[name] })),
    ...(byCategory['미분류'] > 0
      ? [{ name: '미분류', credits: byCategory['미분류'] }]
      : []),
  ]

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
            <span className="mb-1 text-sm text-gray-400">학점</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            총 졸업학점 미설정
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
          <span className="text-sm font-medium text-gray-400">
            미설정
          </span>
        </div>

        <p className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          총 졸업학점이 확정되면 전체 진행률이 표시됩니다.
        </p>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">교양</span>
            <span className="text-gray-500">
              {liberalArtsCredits} / {LIBERAL_ARTS_REQUIRED}학점 (
              {liberalArtsProgress.toFixed(1)}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{ width: `${liberalArtsProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Credit Categories */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">
          영역별 취득 학점
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          지금까지 취득한 학점의 영역별 현황
        </p>

        <div className="mt-6 space-y-5">
          {creditCategories.map((category) => (
            <div key={category.name}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {category.name}
                </span>
                <span className="text-gray-500">
                  {category.credits}학점
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{
                    width: `${earnedCredits > 0 ? (category.credits / earnedCredits) * 100 : 0}%`,
                  }}
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
