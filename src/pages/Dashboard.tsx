
import { useEffect, useState } from 'react'
import GpaChart from '../components/GpaChart'
import { db, type Grade } from '../db/database'
import { Link } from 'react-router-dom'
import { FREE_TRACK_CASES, getFreeTrackCase } from '../data/requirements'
import { MAJOR_SELECTION } from '../data/career'
import {
  calcGroupStatuses,
  calcRemainingCredits,
  calcTotalProgress,
  loadCareer,
  remainingSemesters,
  saveCareerFields,
} from '../utils/graduation'
import {
  GRADE_POINTS,
  IN_PROGRESS,
  calcEarnedCredits,
  calcGpa,
  calcSemesterGpas,
  toPercentage,
} from '../utils/gpa'

const DAY = 86400000
const dday = (date: string, today: Date) =>
  Math.ceil((new Date(date).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) / DAY)

// 컴공 복수전공 신청 일정 (신청 전·신청 중·발표 전에만 표시)
function applyNoticeText(today: Date) {
  const now = today.getTime()
  const { applyStart, applyEnd, announceDate, period, announce } = MAJOR_SELECTION
  if (now < new Date(applyStart).getTime())
    return `컴공 복수전공 신청까지 D-${dday(applyStart, today)} · ${period}`
  if (now < new Date(applyEnd).getTime())
    return `컴공 복수전공 신청 기간이에요 · 마감 D-${dday(applyEnd, today)}`
  if (now < new Date(announceDate).getTime() + DAY)
    return `복수전공 합격 발표 D-${dday(announceDate, today)} · ${announce}`
  return null
}

const Dashboard = () => {
  const [grades, setGrades] = useState<Grade[]>([])
  const [trackCase, setTrackCase] = useState<string | null>(null)
  const [extra, setExtra] = useState(0)
  const [shift, setShift] = useState(false)
  const [today] = useState(() => new Date())

  useEffect(() => {
    db.grades.toArray().then(setGrades)
    loadCareer().then((saved) => {
      setTrackCase(saved?.freeTrackCase ?? null)
      setExtra(saved?.extraSemesters ?? 0)
      setShift(saved?.shiftExcess ?? false)
    })
  }, [])

  // 자유선택 과정·추가학기: 여기서 고르면 졸업 요건·진로 관리에 함께 적용
  const selectedCase = getFreeTrackCase(trackCase)
  const pickTrackCase = (id: string) => {
    setTrackCase(id)
    saveCareerFields({ freeTrackCase: id })
  }
  const pickExtra = (n: number) => {
    setExtra(n)
    saveCareerFields({ extraSemesters: n })
  }

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
  const semestersLeft = remainingSemesters(grades, extra)
  const applyNotice = selectedCase.tracks.includes('ce') ? applyNoticeText(today) : null

  // 졸업 요건 그룹(교양, 전공, 자유선택)별 진행률. 영역별 기준을 넘긴 학점은 그룹 진행률에 넣지 않음
  const groupStatuses = calcGroupStatuses(grades, trackCase, shift)
  // 영역 기준을 다 채우려면 더 들어야 하는 학점과 학기당 학점
  const remaining = calcRemainingCredits(grades, groupStatuses)
  const perSemester = semestersLeft > 0 ? Math.ceil(remaining / semestersLeft) : null
  const groupProgress = groupStatuses.map(({ name, items }) => {
    const earned = items.reduce((sum, i) => sum + Math.min(i.earned, i.credits), 0)
    const required = items.reduce((sum, i) => sum + i.credits, 0)
    return {
      name,
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

      {applyNotice && (
        <Link
          to="/career?tab=track"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
        >
          <span>{applyNotice}</span>
          <span className="text-xs text-violet-500">선발 안내 보기 →</span>
        </Link>
      )}

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
        <p className="mt-2 text-sm text-gray-500">
          영역 기준을 다 채우려면 앞으로{' '}
          <span className="font-medium text-gray-900">{remaining}학점</span>
          {perSemester !== null && (
            <>
              {' '}· 남은 {semestersLeft}학기면 학기당 약{' '}
              <span className="font-medium text-violet-700">{perSemester}학점</span>
            </>
          )}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-6">
          <span className="mr-2 text-sm font-medium text-gray-700">자유선택 과정</span>
          {FREE_TRACK_CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickTrackCase(c.id)}
              className={`h-8 rounded-full border px-3.5 text-sm font-medium transition ${
                selectedCase.id === c.id
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-medium text-gray-700">추가학기</span>
          {[0, 1, 2].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pickExtra(n)}
              className={`h-8 rounded-full border px-3.5 text-sm font-medium transition ${
                extra === n
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {n === 0 ? '없음' : `${n}학기`}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
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
