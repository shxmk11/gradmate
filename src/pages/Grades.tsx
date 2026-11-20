
import { useEffect, useState } from 'react'
import { CATEGORIES, db, type Category, type Grade } from '../db/database'
import { AREA_OPTIONS } from '../data/requirements'
import { GRADE_OPTIONS, calcSemesterGpas } from '../utils/gpa'

const fieldClass =
  'block h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'

// Safari 기본 스핀 버튼 제거
const numberFieldClass = `${fieldClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`

const selectClass = `${fieldClass} cursor-pointer appearance-none pr-10`

const SelectChevron = () => (
  <svg
    className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function Grades() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [year, setYear] = useState(2026)
  const [semester, setSemester] = useState<Grade['semester']>('2학기')
  const [courseName, setCourseName] = useState('')
  const [credits, setCredits] = useState(3)
  const [grade, setGrade] = useState('A+')
  const [category, setCategory] = useState<Category>('공통교양')
  const [area, setArea] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const areaOptions = AREA_OPTIONS[category] ?? []

  const loadGrades = async () => {
    const data = await db.grades.toArray()
    setGrades(data)
  }

  useEffect(() => {
    db.grades.toArray().then(setGrades)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!courseName.trim()) return

    const data = {
      year,
      semester,
      courseName: courseName.trim(),
      credits,
      grade,
      category,
      area: areaOptions.length > 0 && area ? area : undefined,
    }

    if (editingId !== null) {
      await db.grades.update(editingId, data)
      setEditingId(null)
    } else {
      await db.grades.add(data)
    }

    setCourseName('')
    setArea('')
    await loadGrades()
  }

  const handleEdit = (item: Grade) => {
    if (item.id === undefined) return
    setEditingId(item.id)
    setYear(item.year)
    setSemester(item.semester)
    setCourseName(item.courseName)
    setCredits(item.credits)
    setGrade(item.grade)
    setCategory(item.category ?? '공통교양')
    setArea(item.area ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setCourseName('')
    setArea('')
  }

  // 최근 학기가 위로 오도록 정렬
  const semesters = calcSemesterGpas(grades).reverse()

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-violet-600">GRADMATE</p>
        <h1 className="mt-2 text-3xl font-bold">성적 관리</h1>
        <p className="mt-2 text-gray-500">
          수강 과목과 성적을 관리해 보세요.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold">
          {editingId !== null ? '과목 수정' : '과목 등록'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            연도
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={numberFieldClass}
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            학기
            <div className="relative">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Grade['semester'])}
                className={selectClass}
              >
                <option>1학기</option>
                <option>2학기</option>
                <option>여름학기</option>
                <option>겨울학기</option>
              </select>
              <SelectChevron />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            영역
            <div className="relative">
              <select
                value={category}
                onChange={(e) => {
                  const next = e.target.value as Category
                  setCategory(next)
                  // 새 영역에 없는 세부 영역이면 비우기
                  if (!(AREA_OPTIONS[next] ?? []).includes(area)) setArea('')
                }}
                className={selectClass}
              >
                {CATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </label>

          <label
            className={`flex flex-col gap-2 text-sm font-medium ${
              areaOptions.length > 0 ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            세부 영역
            <div className="relative">
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                disabled={areaOptions.length === 0}
                required={areaOptions.length > 0}
                className={`${selectClass} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="" disabled={areaOptions.length > 0}>
                  {areaOptions.length > 0 ? '세부 영역 선택' : '해당 없음'}
                </option>
                {areaOptions.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
            과목명
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="과목명을 입력하세요."
              className={fieldClass}
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            학점
            <div className="relative">
              <select
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className={selectClass}
              >
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    {value}학점
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            성적
            <div className="relative">
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className={selectClass}
              >
                {GRADE_OPTIONS.map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
              <SelectChevron />
            </div>
          </label>

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              className="flex-1 h-11 rounded-lg bg-violet-600 px-5 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              {editingId !== null ? '수정 완료' : '과목 등록'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-11 rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                취소
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold">
          등록된 과목 ({grades.length})
        </h2>

        {grades.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            등록된 과목이 없습니다.
          </p>
        ) : (
          <div className="space-y-8">
            {semesters.map((sem) => {
              const items = grades.filter(
                (g) => g.year === sem.year && g.semester === sem.semester,
              )
              const totalCredits = items.reduce((sum, g) => sum + g.credits, 0)

              return (
                <div key={`${sem.year}-${sem.semester}`}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-bold text-gray-900">
                      {sem.year}년 {sem.semester}
                    </h3>
                    <p className="text-sm text-gray-500">
                      학기 평점{' '}
                      <span className="font-medium text-gray-900">
                        {sem.gpa !== null ? sem.gpa.toFixed(2) : '-'}
                      </span>
                      <span className="mx-2 text-gray-300">·</span>
                      누적{' '}
                      <span className="font-medium text-gray-900">
                        {sem.cumulativeGpa !== null
                          ? sem.cumulativeGpa.toFixed(2)
                          : '-'}
                      </span>
                      <span className="mx-2 text-gray-300">·</span>
                      {totalCredits}학점 수강
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-200 text-gray-500">
                        <tr>
                          <th className="p-3">영역</th>
                          <th className="p-3">과목명</th>
                          <th className="p-3">학점</th>
                          <th className="p-3">성적</th>
                          <th className="p-3">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={item.id}
                            className={`border-b border-gray-100 ${
                              item.id === editingId ? 'bg-violet-50' : ''
                            }`}
                          >
                            <td className="p-3 whitespace-nowrap">
                              {item.category ?? (
                                <span className="text-gray-400">미분류</span>
                              )}
                              {item.area && item.category && AREA_OPTIONS[item.category] && (
                                <span className="block text-xs text-gray-400">
                                  {item.area}
                                </span>
                              )}
                            </td>
                            <td className="p-3">{item.courseName}</td>
                            <td className="p-3">{item.credits}</td>
                            <td className="p-3 font-medium">{item.grade}</td>
                            <td className="p-3 whitespace-nowrap">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-gray-500 hover:text-gray-900"
                              >
                                수정
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default Grades
