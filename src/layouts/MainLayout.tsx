
import { NavLink, Outlet } from 'react-router-dom'

const menus = [
  { name: '대시보드', path: '/' },
  { name: '성적 관리', path: '/grades' },
  { name: '졸업 요건', path: '/graduation' },
  { name: '진로 관리', path: '/career' },
]

function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-gray-200 bg-white p-6">
        <h1 className="mb-10 text-2xl font-bold text-violet-600">
          GradMate
        </h1>

        <nav className="space-y-2">
          {menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.path === '/'}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {menu.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="ml-60 min-h-screen p-10">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
