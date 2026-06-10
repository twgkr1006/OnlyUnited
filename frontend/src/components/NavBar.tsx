import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: '홈', path: '/' },
  { label: '경기일정', path: '/matches' },
  { label: '시즌', path: '/season' },
  { label: '선수단', path: '/squad' },
  { label: '이적', path: '/transfer' },
  { label: '순위표', path: '/standings' },
  { label: '커뮤니티', path: '/board' },
  { label: '뉴스', path: '/news' },
];

interface NavBarProps {
  /** true면 로고 없이 메뉴만 표시 (홈에서 사용) */
  menuOnly?: boolean;
}

export default function NavBar({ menuOnly = false }: NavBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-[#1a1a1a] border-b border-[#333]">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-12 gap-1">
          {/* 로고 (홈 아닌 페이지에서만) */}
          {!menuOnly && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center mr-4 flex-shrink-0"
            >
              <img src="/logo.png" alt="OnlyUnited" className="h-7 w-auto" />
            </button>
          )}

          {/* 메뉴 아이템 */}
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 h-full text-sm font-medium transition-colors border-b-2 ${
                isActive(item.path)
                  ? 'text-white border-red-500'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
