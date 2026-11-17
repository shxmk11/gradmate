
const Dashboard = () => {
  const totalCredits = 130
  const earnedCredits = 50
  const progress = (earnedCredits / totalCredits) * 100

  const creditCategories = [
    { name: '공통교양', credits: 16 },
    { name: '핵심교양', credits: 9 },
    { name: '진로소양', credits: 1 },
    { name: '핵심전공', credits: 24 },
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
              3.45
            </span>
            <span className="mb-1 text-sm text-gray-400">/ 4.5</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            백분위 89.50
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">
            취득 학점
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">
              50
            </span>
            <span className="mb-1 text-sm text-gray-400">/ 130학점</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            졸업까지 80학점 남음
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
            {progress.toFixed(1)}%
          </span>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-sm">
          <span className="font-medium text-gray-700">
            {earnedCredits}학점 취득
          </span>
          <span className="text-gray-400">
            목표 {totalCredits}학점
          </span>
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
                    width: `${(category.credits / earnedCredits) * 100}%`,
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
