import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: '홈', path: '/' },
  { label: '경기일정', path: '/matches' },
  { label: '시즌', path: '/season' },
  { label: '선수단', path: '/squad' },
  { label: '이적', path: '/transfer' },
  { label: '레전드', path: '/legends' },
  { label: '순위표', path: '/standings' },
  { label: '커뮤니티', path: '/board' },
  { label: '뉴스', path: '/news' },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [_menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white flex flex-col">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#111] border-b border-[#2a2a2a] shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14 gap-0">

            {/* 로고 */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 mr-6 flex-shrink-0 group"
            >
              <img src="/logo.png" alt="OnlyUnited" className="h-8 w-auto" />
              <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors hidden sm:block">
                OnlyUnited
              </span>
            </button>

            {/* 네비 메뉴 */}
            <nav className="flex items-center flex-1 overflow-x-auto scrollbar-hide">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex-shrink-0 px-4 h-14 text-sm font-medium transition-all border-b-2 ${
                    isActive(item.path)
                      ? 'text-white border-red-500'
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#2a2a2a] py-4 text-center text-xs text-gray-600">
        © OnlyUnited All Rights Reserved.
      </footer>
    </div>
  );
}
