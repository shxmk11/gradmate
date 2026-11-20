import { useState } from 'react'
import type { Grade } from '../db/database'
import { REQUIREMENTS } from '../data/requirements'
import { calcEarnedCredits, calcGpa, calcRequiredAverage, gradeAtLeast } from '../utils/gpa'

const inputClass =
  'block h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

function GpaGoal({ grades }: { grades: Grade[] }) {
  const gpa = calcGpa(grades)
  const toGraduate = Math.max(REQUIREMENTS.totalCredits - calcEarnedCredits(grades), 0)
  const [target, setTarget] = useState('')
  const [credits, setCredits] = useState(18)

  const targetValue = target === '' ? (gpa !== null ? Math.min(Math.ceil(gpa * 10) / 10, 4.5) : 4.0) : Number(target)
  const needed = calcRequiredAverage(grades, targetValue, credits)
  const presets = [
    { label: '한 학기 (18학점)', value: 18 },
    { label: `졸업까지 (${toGraduate}학점)`, value: toGraduate },
  ]

  let result: string
  if (needed === null || Number.isNaN(needed)) result = '앞으로 들을 학점을 입력해 주세요.'
  else if (needed > 4.5) result = `${credits}학점으로는 목표 평점 ${targetValue.toFixed(2)}에 도달하기 어려워요. (평균 ${needed.toFixed(2)} 필요)`
  else if (needed <= 0) result = `이미 목표 평점 ${targetValue.toFixed(2)}을 넘었어요.`
  else
    result = `앞으로 ${credits}학점에서 평균 ${needed.toFixed(2)} 이상 받으면 돼요. 모든 과목에서 ${gradeAtLeast(needed)} 이상을 받으면 확실히 넘어요.`

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold">목표 평점 계산기</h2>
      <p className="mt-1 text-sm text-gray-500">
        지금 평점 {gpa !== null ? gpa.toFixed(2) : '-'}에서 목표 평점을 맞추려면 앞으로 평균 몇 점이 필요한지 계산해요. P 과목은 빼고 계산해요.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          목표 평점
          <input
            type="number"
            step="0.01"
            min="0"
            max="4.5"
            value={target}
            placeholder={targetValue.toFixed(2)}
            onChange={(e) => setTarget(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          앞으로 들을 학점 (평점 대상)
          <input
            type="number"
            min="1"
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setCredits(p.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              credits === p.value
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">{result}</p>
    </section>
  )
}

export default GpaGoal
