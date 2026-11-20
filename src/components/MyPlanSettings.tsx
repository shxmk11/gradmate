import { useEffect, useState } from 'react'
import { db, type CareerState, type Grade } from '../db/database'
import { JOBS } from '../data/career'
import { FREE_TRACK_CASES, getFreeTrackCase } from '../data/requirements'
import { calcExcessMajorCredits, loadCareer, saveCareerFields } from '../utils/graduation'

const chip = (active: boolean) =>
  `h-9 rounded-full border px-4 text-sm font-medium transition ${
    active
      ? 'border-violet-300 bg-violet-50 text-violet-700'
      : 'border-gray-200 text-gray-600 hover:border-gray-300'
  }`

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="py-5">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

// 설정의 「내 계획」: 여기서 고르면 대시보드·졸업 요건·수강 계획·진로에 모두 적용
function MyPlanSettings() {
  const [state, setState] = useState<Partial<CareerState>>({})
  const [grades, setGrades] = useState<Grade[]>([])

  useEffect(() => {
    loadCareer().then((saved) => saved && setState(saved))
    db.grades.toArray().then(setGrades)
  }, [])

  const update = (fields: Partial<Omit<CareerState, 'key'>>) => {
    setState({ ...state, ...fields })
    saveCareerFields(fields)
  }

  const selectedCase = getFreeTrackCase(state.freeTrackCase)
  const extra = state.extraSemesters ?? 0
  const excess = calcExcessMajorCredits(grades)

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold">내 계획</h2>
      <p className="mt-1 text-sm text-gray-500">
        여기서 고르면 대시보드, 졸업 요건, 수강 계획, 진로 관리에 모두 적용돼요.
      </p>

      <div className="mt-2 divide-y divide-gray-100">
        <Row title="자유선택 과정" desc="졸업 요건의 자유선택 학점과 추천 과목이 바뀌어요.">
          {FREE_TRACK_CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update({ freeTrackCase: c.id })}
              className={chip(selectedCase.id === c.id)}
            >
              {c.label}
            </button>
          ))}
        </Row>

        <Row title="추가학기" desc="4학년 2학기 뒤에 더 다닐 학기예요. 학기당 필요 학점과 수강 계획 학기에 반영돼요.">
          {[0, 1, 2].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ extraSemesters: n })}
              className={chip(extra === n)}
            >
              {n === 0 ? '없음' : `${n}학기`}
            </button>
          ))}
        </Row>

        <Row title="희망 직무" desc="추천 과목과 역량 분석 기준이 돼요. 직무 설명은 진로 관리에서 볼 수 있어요.">
          {JOBS.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => update({ targetJobId: state.targetJobId === j.id ? null : j.id })}
              className={chip(state.targetJobId === j.id)}
            >
              {j.name}
            </button>
          ))}
        </Row>

        {selectedCase.tracks.includes('ce') && excess > 0 && (
          <div className="py-5">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={state.shiftExcess ?? false}
                onChange={() => update({ shiftExcess: !state.shiftExcess })}
                className="mt-0.5 h-4 w-4 accent-violet-600"
              />
              <span>
                <span className="font-medium text-gray-900">
                  주전공 기준을 넘긴 {excess}학점을 컴공 복수전공으로 옮겨 계산
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  컴공 전공인정 과목이면 복수전공 합격 후 이수구분변경신청으로 옮길 수 있다는 가정이에요. 실제 인정 여부는 전공인정과목조회로 확인해 주세요.
                </span>
              </span>
            </label>
          </div>
        )}
      </div>
    </section>
  )
}

export default MyPlanSettings
