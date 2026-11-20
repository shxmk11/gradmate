import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CareerState } from '../db/database'
import { JOBS } from '../data/career'
import { getFreeTrackCase } from '../data/requirements'
import { loadCareer } from '../utils/graduation'

// 페이지 위에 보여 주는 「내 계획」 요약. 바꾸는 곳은 설정 한 곳
function PlanSummary() {
  const [state, setState] = useState<CareerState | null>(null)

  useEffect(() => {
    loadCareer().then((saved) => setState(saved ?? null))
  }, [])

  const job = JOBS.find((j) => j.id === state?.targetJobId)
  const extra = state?.extraSemesters ?? 0
  const items = [
    getFreeTrackCase(state?.freeTrackCase).label,
    extra > 0 ? `추가학기 ${extra}` : '추가학기 없음',
    job ? job.name : '희망 직무 미정',
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
      <span className="font-medium text-gray-500">내 계획</span>
      {items.map((item) => (
        <span key={item} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
          {item}
        </span>
      ))}
      {state?.shiftExcess && (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
          초과 학점 컴공으로 계산
        </span>
      )}
      <Link to="/settings" className="ml-auto text-xs font-medium text-violet-600 hover:underline">
        변경
      </Link>
    </div>
  )
}

export default PlanSummary
