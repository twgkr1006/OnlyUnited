import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface PostSummary {
    id: number;
    title: string;
    nickname: string;
    category: string;
    views: number;
    likes: number;
    createdAt: string;
    _count: { comments: number };
}

const CATEGORY_COLORS: Record<string, string> = {
    FREE: 'bg-gray-600',
    MATCH: 'bg-blue-700',
    PLAYER: 'bg-red-700',
    TRANSFER: 'bg-yellow-600',
    HUMOR: 'bg-green-700',
};

const CATEGORY_LABELS: Record<string, string> = {
    FREE: '자유', MATCH: '경기', PLAYER: '선수', TRANSFER: '이적', HUMOR: '유머',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
}

const RecentPosts = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/board?page=1')
            .then(r => setPosts(r.data.posts?.slice(0, 5) ?? []))
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-[#545454] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold text-sm">커뮤니티</h3>
                <button
                    onClick={() => navigate('/board')}
                    className="text-gray-400 hover:text-white text-xs transition-colors"
                >
                    전체 →
                </button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-[#3a3939] rounded animate-pulse" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-xs">첫 게시글을 작성해보세요!</div>
            ) : (
                <div className="space-y-1.5">
                    {posts.map(post => (
                        <button
                            key={post.id}
                            onClick={() => navigate(`/board/${post.id}`)}
                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#3a3939] transition-colors group"
                        >
                            <span className={`flex-shrink-0 text-xs text-white px-1.5 py-0.5 rounded ${CATEGORY_COLORS[post.category] ?? 'bg-gray-600'}`}>
                                {CATEGORY_LABELS[post.category] ?? post.category}
                            </span>
                            <span className="text-gray-200 text-xs flex-1 truncate group-hover:text-white transition-colors">
                                {post.title}
                            </span>
                            {post._count.comments > 0 && (
                                <span className="text-red-400 text-xs flex-shrink-0">[{post._count.comments}]</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={() => navigate('/board/write')}
                className="w-full mt-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs rounded-lg transition-colors font-medium"
            >
                + 글쓰기
            </button>
        </div>
    );
};

export default RecentPosts;
