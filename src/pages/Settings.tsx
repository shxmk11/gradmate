import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, db, type Grade } from '../db/database'
import { GRADE_OPTIONS } from '../utils/gpa'

const SEMESTERS: Grade['semester'][] = ['1학기', '2학기', '여름학기', '겨울학기']

// 가져온 데이터 한 건이 올바른 과목인지 검사
function toGrade(raw: unknown): Grade | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>

  if (typeof r.year !== 'number') return null
  if (!SEMESTERS.includes(r.semester as Grade['semester'])) return null
  if (typeof r.courseName !== 'string' || !r.courseName.trim()) return null
  if (typeof r.credits !== 'number' || r.credits < 0) return null
  if (typeof r.grade !== 'string' || !GRADE_OPTIONS.includes(r.grade)) return null
  if (
    r.category !== undefined &&
    !CATEGORIES.includes(r.category as Grade['category'] & string)
  ) {
    return null
  }

  return {
    year: r.year,
    semester: r.semester as Grade['semester'],
    courseName: r.courseName.trim(),
    credits: r.credits,
    grade: r.grade,
    category: r.category as Grade['category'],
  }
}

function Settings() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(
    null,
  )
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    db.grades.count().then(setCount)
  }, [])

  const handleExport = async () => {
    const grades = await db.grades.toArray()
    const data = {
      app: 'GradMate',
      version: 1,
      exportedAt: new Date().toISOString(),
      grades: grades.map((g) => {
        const copy = { ...g }
        delete copy.id
        return copy
      }),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gradmate-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const parsed: unknown = JSON.parse(await file.text())
      // 백업 파일 형식({ grades: [...] })과 과목 배열([...]) 모두 지원
      const list = Array.isArray(parsed)
        ? parsed
        : (parsed as { grades?: unknown }).grades

      if (!Array.isArray(list)) {
        setMessage({ type: 'error', text: '과목 목록을 찾을 수 없는 파일입니다.' })
        return
      }

      const grades = list.map(toGrade)
      const invalid = grades.findIndex((g) => g === null)
      if (invalid !== -1) {
        setMessage({
          type: 'error',
          text: `${invalid + 1}번째 과목의 형식이 올바르지 않아 가져오지 않았습니다.`,
        })
        return
      }

      if (
        count > 0 &&
        !window.confirm(
          `기존 과목 ${count}개를 지우고 파일의 과목 ${grades.length}개로 바꿉니다. 계속할까요?`,
        )
      ) {
        return
      }

      await db.transaction('rw', db.grades, async () => {
        await db.grades.clear()
        await db.grades.bulkAdd(grades as Grade[])
      })

      setCount(grades.length)
      setMessage({ type: 'ok', text: `과목 ${grades.length}개를 가져왔습니다.` })
    } catch {
      setMessage({ type: 'error', text: 'JSON 파일을 읽을 수 없습니다.' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-violet-600">GRADMATE</p>
        <h1 className="mt-2 text-3xl font-bold">설정</h1>
        <p className="mt-2 text-gray-500">데이터를 백업하고 복원해 보세요.</p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">데이터 관리</h2>
        <p className="mt-1 text-sm text-gray-500">
          데이터는 이 브라우저에만 저장됩니다. 현재 저장된 과목 {count}개
        </p>

        <div className="mt-6 divide-y divide-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">내보내기</p>
              <p className="mt-1 text-sm text-gray-500">
                모든 과목을 JSON 파일로 저장합니다.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="h-11 rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              JSON 내보내기
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">가져오기</p>
              <p className="mt-1 text-sm text-gray-500">
                JSON 파일의 과목으로 기존 데이터를 바꿉니다.
              </p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="h-11 rounded-lg bg-violet-600 px-5 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              JSON 가져오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

        {message && (
          <p
            className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === 'ok'
                ? 'bg-violet-50 text-violet-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>
    </div>
  )
}

export default Settings
