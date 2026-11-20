
import { useEffect, useState } from 'react'
import { CATEGORIES, db, type Category, type Grade } from '../db/database'

function Grades() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [year, setYear] = useState(2026)
  const [semester, setSemester] = useState<Grade['semester']>('2학기')
  const [courseName, setCourseName] = useState('')
  const [credits, setCredits] = useState(3)
  const [grade, setGrade] = useState('A+')
  const [category, setCategory] = useState<Category>('공통교양')

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

    await db.grades.add({
      year,
      semester,
      courseName: courseName.trim(),
      credits,
      grade,
      category,
    })

    setCourseName('')
    await loadGrades()
  }

  const handleDelete = async (id: number) => {
    await db.grades.delete(id)
    await loadGrades()
  }

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
        <h2 className="mb-5 text-lg font-bold">과목 등록</h2>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            연도
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 p-3"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            학기
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Grade['semester'])}
              className="w-full rounded-lg border border-gray-200 p-3"
            >
              <option>1학기</option>
              <option>2학기</option>
              <option>여름학기</option>
              <option>겨울학기</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            영역
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-lg border border-gray-200 p-3"
            >
              {CATEGORIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            과목명
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="과목명을 입력하세요."
              className="w-full rounded-lg border border-gray-200 p-3"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            학점
            <select
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 p-3"
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value}학점
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            성적
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-lg border border-gray-200 p-3"
            >
              {['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F', 'P'].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-700 sm:col-span-2"
          >
            과목 등록
          </button>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="p-3">학기</th>
                  <th className="p-3">영역</th>
                  <th className="p-3">과목명</th>
                  <th className="p-3">학점</th>
                  <th className="p-3">성적</th>
                  <th className="p-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="p-3 whitespace-nowrap">
                      {item.year}년 {item.semester}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {item.category ?? (
                        <span className="text-gray-400">미분류</span>
                      )}
                    </td>
                    <td className="p-3">{item.courseName}</td>
                    <td className="p-3">{item.credits}</td>
                    <td className="p-3 font-medium">{item.grade}</td>
                    <td className="p-3">
                      <button
                        onClick={() => item.id !== undefined && handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Grades
