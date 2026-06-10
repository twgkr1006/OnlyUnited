import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface PostSummary {
  id: number;
  title: string;
  nickname: string;
  category: string;
  views: number;
  likes: number;
  isPinned: boolean;
  hasPoll: boolean;
  createdAt: string;
  _count: { comments: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  ALL: '전체',
  FREE: '자유',
  MATCH: '경기분석',
  PLAYER: '선수',
  TRANSFER: '이적/소식',
  HUMOR: '유머',
  VOTE: '투표',
};

const CATEGORY_COLORS: Record<string, string> = {
  FREE: 'bg-gray-600',
  MATCH: 'bg-blue-700',
  PLAYER: 'bg-red-700',
  TRANSFER: 'bg-yellow-600',
  HUMOR: 'bg-green-700',
  VOTE: 'bg-purple-700',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}초 전`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

export default function BoardPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const category = params.get('category') || 'ALL';
  const page = parseInt(params.get('page') || '1', 10);
  const q = params.get('q') || '';

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page) });
    if (category !== 'ALL') query.set('category', category);
    if (q) query.set('q', q);

    axios.get(`/api/board?${query}`)
      .then(r => { setPosts(r.data.posts); setTotal(r.data.total); })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [category, page, q]);

  const setCategory = (c: string) => setParams({ category: c, page: '1' });
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ category, page: '1', q: search });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold mb-0.5">커뮤니티 게시판</h1>
          <p className="text-red-200 text-sm">맨체스터 유나이티드 팬 커뮤니티</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === key
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + Write Button */}
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
            <button type="submit" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
              검색
            </button>
          </form>
          <button
            onClick={() => navigate('/board/write')}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
          >
            글쓰기
          </button>
        </div>

        {/* Post List */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">게시글이 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-800 bg-gray-900 rounded-xl overflow-hidden">
            {posts.map(post => (
              <button
                key={post.id}
                onClick={() => navigate(`/board/${post.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start gap-2">
                  {post.isPinned && (
                    <span className="flex-shrink-0 mt-0.5 text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">
                      공지
                    </span>
                  )}
                  <span className={`flex-shrink-0 mt-0.5 text-xs text-white px-1.5 py-0.5 rounded ${CATEGORY_COLORS[post.category] ?? 'bg-gray-600'}`}>
                    {CATEGORY_LABELS[post.category] ?? post.category}
                  </span>
                  <span className="font-medium text-sm leading-snug line-clamp-1 flex-1">
                    {post.hasPoll && <span className="mr-1">📊</span>}
                    {post.title}
                  </span>
                  {post._count.comments > 0 && (
                    <span className="flex-shrink-0 text-red-400 text-xs font-medium">
                      [{post._count.comments}]
                    </span>
                  )}
                </div>
                {/* Bottom row */}
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>{post.nickname}</span>
                  <span>{timeAgo(post.createdAt)}</span>
                  <span>조회 {post.views.toLocaleString()}</span>
                  {post.likes > 0 && <span className="text-red-400">♥ {post.likes}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setParams({ category, page: String(p), ...(q ? { q } : {}) })}
                className={`w-8 h-8 rounded text-sm ${
                  p === page ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
