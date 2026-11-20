import { Link } from 'react-router-dom'
import type { CareerState, Grade } from '../db/database'
import { JOBS, skillName } from '../data/career'
import { calcSkills, slotLabel, upcomingSemesters } from '../utils/career'

// 대시보드용 진로 요약: 희망 직무, 부족한 역량, 다음 학기 계획
function CareerSummary({ grades, career }: { grades: Grade[]; career: CareerState | null }) {
  const job = JOBS.find((j) => j.id === career?.targetJobId) ?? null
  const skills = calcSkills(grades, career?.manualSkills ?? [])
  const owned = new Set(skills.filter((s) => s.owned).map((s) => s.id))

  const next = upcomingSemesters(grades)[0]
  const nextPlan = (career?.plan ?? []).filter(
    (p) => p.year === next.year && p.semester === next.semester,
  )

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">진로</h2>
          <p className="mt-1 text-sm text-gray-500">희망 직무와 다음 학기 계획</p>
        </div>
        <Link to="/career" className="text-sm font-medium text-violet-600 hover:text-violet-700">
          진로 관리 →
        </Link>
      </div>

      {!job ? (
        <p className="mt-6 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          진로 관리에서 희망 직무를 골라 보세요.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">희망 직무</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{job.name}</p>
            <p className="mt-1 text-sm text-gray-500">
              핵심 역량{' '}
              <span className="font-medium text-violet-700">
                {job.core.filter((id) => owned.has(id)).length} / {job.core.length}
              </span>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">부족한 역량</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...job.core, ...job.nice].filter((id) => !owned.has(id)).length === 0 ? (
                <span className="text-sm text-gray-700">모두 갖췄어요</span>
              ) : (
                [...job.core, ...job.nice]
                  .filter((id) => !owned.has(id))
                  .map((id) => (
                    <span
                      key={id}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        job.core.includes(id)
                          ? 'bg-violet-50 text-violet-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {skillName(id)}
                    </span>
                  ))
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">{slotLabel(next)} 계획</p>
            {nextPlan.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">아직 담은 과목이 없어요.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {nextPlan.map((p) => (
                  <li key={p.courseName}>{p.courseName}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default CareerSummary
