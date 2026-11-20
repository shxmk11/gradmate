import { NavLink, Outlet } from 'react-router-dom'

const menus = [
  { name: '대시보드', path: '/' },
  { name: '성적 관리', path: '/grades' },
  { name: '졸업 요건', path: '/graduation' },
  { name: '수강 계획', path: '/plan' },
  { name: '진로 관리', path: '/career' },
  { name: '설정', path: '/settings' },
]

const linkClass = (isActive: boolean) =>
  `rounded-lg px-4 py-3 text-sm font-medium transition ${
    isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-100'
  }`

function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 데스크톱: 왼쪽 사이드바 */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-gray-200 bg-white p-6 md:block">
        <h1 className="mb-10 text-2xl font-bold text-violet-600">GradMate</h1>

        <nav className="space-y-2">
          {menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.path === '/'}
              className={({ isActive }) => `block ${linkClass(isActive)}`}
            >
              {menu.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 모바일: 위쪽 메뉴 (가로 스크롤) */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white md:hidden">
        <h1 className="px-4 pt-3 text-lg font-bold text-violet-600">GradMate</h1>
        <nav className="flex gap-1 overflow-x-auto px-2 py-2">
          {menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.path === '/'}
              className={({ isActive }) => `shrink-0 whitespace-nowrap ${linkClass(isActive)} py-2`}
            >
              {menu.name}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="min-h-screen px-4 py-6 md:ml-60 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
