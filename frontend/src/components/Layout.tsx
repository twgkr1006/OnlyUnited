import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

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

interface User {
  user_profile_image?: string;
  user_name?: string;
  user_email: string;
}

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    axios.get('/api/user/me', { withCredentials: true })
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null));
  }, []);

  // 페이지 이동 시 드롭다운 닫기
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const handleLogout = () => {
    axios.get('http://localhost:3001/auth/logout', { withCredentials: true })
      .finally(() => { setUser(null); navigate('/'); });
  };

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

            {/* 우측: 로그인 / 프로필 */}
            <div className="flex-shrink-0 ml-4 relative">
              {user ? (
                <>
                  <button
                    onClick={() => setMenuOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                  >
                    <img
                      src={user.user_profile_image || '/logo.png'}
                      alt="프로필"
                      className="w-7 h-7 rounded-full object-cover border border-gray-600"
                    />
                    <span className="text-sm text-gray-200 hidden sm:block max-w-[80px] truncate">
                      {user.user_name || user.user_email}
                    </span>
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-12 z-50 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl w-44 py-1 overflow-hidden">
                        <div className="px-4 py-2 border-b border-[#333]">
                          <p className="text-xs text-gray-400 truncate">{user.user_email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        >
                          로그아웃
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  로그인
                </button>
              )}
            </div>
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
