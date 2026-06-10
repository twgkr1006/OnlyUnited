import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface Comment {
  id: number;
  nickname: string;
  content: string;
  createdAt: string;
}

interface PollOption {
  id: number;
  text: string;
  voteCount: number;
}

interface Poll {
  id: number;
  question: string;
  totalVotes: number;
  endsAt: string | null;
  options: PollOption[];
  myVoteOptionId: number | null;
}

interface Post {
  id: number;
  title: string;
  content: string;
  nickname: string;
  category: string;
  views: number;
  likes: number;
  isPinned: boolean;
  hasPoll: boolean;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  poll: Poll | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유',
  MATCH: '경기분석',
  PLAYER: '선수',
  TRANSFER: '이적/소식',
  HUMOR: '유머',
  VOTE: '투표',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}초 전`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

// ─── 투표 카드 컴포넌트 ──────────────────────────────────────────────────────
function PollCard({
  poll,
  onVote,
  voteLoading,
}: {
  poll: Poll;
  onVote: (optionId: number) => void;
  voteLoading: boolean;
}) {
  const hasVoted = poll.myVoteOptionId !== null;
  const total = poll.options.reduce((s, o) => s + o.voteCount, 0);
  const isEnded = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;
  const showResults = hasVoted || isEnded;

  return (
    <div className="mt-5 border border-gray-700 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
        <span className="text-base">📊</span>
        <span className="text-sm font-semibold text-white flex-1">{poll.question}</span>
        {isEnded && (
          <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">종료</span>
        )}
      </div>

      {/* 항목들 */}
      <div className="p-4 space-y-2.5">
        {poll.options.map(opt => {
          const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
          const isMyVote = poll.myVoteOptionId === opt.id;

          if (showResults) {
            // 결과 보기 (투표 완료 또는 종료)
            return (
              <div key={opt.id} className={`relative rounded-lg overflow-hidden transition-all ${isMyVote ? 'ring-2 ring-red-500' : ''}`}>
                <div
                  className={`absolute inset-0 rounded-lg transition-all duration-700 ${
                    isMyVote ? 'bg-red-900/60' : 'bg-gray-700/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {isMyVote && <span className="text-red-400 text-xs">✓</span>}
                    <span className={`text-sm ${isMyVote ? 'text-white font-medium' : 'text-gray-200'}`}>
                      {opt.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span>{opt.voteCount}표</span>
                    <span className={`font-bold ${isMyVote ? 'text-red-300' : 'text-gray-400'}`}>{pct}%</span>
                  </div>
                </div>
              </div>
            );
          }

          // 투표 전
          return (
            <button
              key={opt.id}
              onClick={() => onVote(opt.id)}
              disabled={voteLoading}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-600 text-sm text-gray-200 transition-all disabled:opacity-50 text-left"
            >
              <span className="w-5 h-5 rounded-full border-2 border-gray-500 flex-shrink-0" />
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* 푸터 */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-500">
        <span>총 {total.toLocaleString()}명 참여</span>
        {hasVoted && !isEnded && (
          <button
            onClick={() => onVote(poll.myVoteOptionId!)}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            투표 취소
          </button>
        )}
        {poll.endsAt && !isEnded && (
          <span>마감: {new Date(poll.endsAt).toLocaleDateString('ko-KR')}</span>
        )}
      </div>
    </div>
  );
}

function getClientId() {
  let id = localStorage.getItem('ou_client_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ou_client_id', id);
  }
  return id;
}

function getNickname() {
  return localStorage.getItem('ou_nickname') || '';
}

function saveNickname(n: string) {
  localStorage.setItem('ou_nickname', n);
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [commentNick, setCommentNick] = useState(getNickname());
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteNick, setDeleteNick] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  // 투표 상태
  const [voteLoading, setVoteLoading] = useState(false);

  const clientId = getClientId();
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/board/${id}`, { params: { clientId } })
      .then(r => {
        setPost(r.data);
        const likedPosts = JSON.parse(localStorage.getItem('ou_liked_posts') || '{}');
        setLiked(!!likedPosts[r.data.id]);
      })
      .catch(() => navigate('/board'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!post || likeLoading) return;
    setLikeLoading(true);
    try {
      const r = await axios.post(`/api/board/${post.id}/like`, { clientId });
      setPost(p => p ? { ...p, likes: r.data.likes } : p);
      const likedPosts = JSON.parse(localStorage.getItem('ou_liked_posts') || '{}');
      if (r.data.liked) likedPosts[post.id] = true;
      else delete likedPosts[post.id];
      localStorage.setItem('ou_liked_posts', JSON.stringify(likedPosts));
      setLiked(r.data.liked);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim() || !commentNick.trim()) return;
    setSubmitting(true);
    saveNickname(commentNick);
    try {
      const r = await axios.post(`/api/board/${post.id}/comments`, {
        content: commentText,
        nickname: commentNick,
      });
      setPost(p => p ? { ...p, comments: [...p.comments, r.data] } : p);
      setCommentText('');
    } catch (err: any) {
      alert(err.response?.data?.error || '댓글 작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (cid: number) => {
    const nick = prompt('작성 시 사용한 닉네임을 입력하세요:');
    if (!nick) return;
    try {
      await axios.delete(`/api/board/${post!.id}/comments/${cid}`, { data: { nickname: nick } });
      setPost(p => p ? { ...p, comments: p.comments.filter(c => c.id !== cid) } : p);
    } catch (err: any) {
      alert(err.response?.data?.error || '삭제 실패');
    }
  };

  const handleVote = async (optionId: number) => {
    if (!post?.poll || voteLoading) return;
    setVoteLoading(true);
    try {
      const r = await axios.post(`/api/board/${post.id}/poll/vote`, { clientId, optionId });
      setPost(p => p ? {
        ...p,
        poll: p.poll ? {
          ...r.data.poll,
          myVoteOptionId: r.data.myVoteOptionId,
        } : null,
      } : p);
    } catch (err: any) {
      alert(err.response?.data?.error || '투표 실패');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      await axios.delete(`/api/board/${post.id}`, { data: { nickname: deleteNick } });
      navigate('/board');
    } catch (err: any) {
      alert(err.response?.data?.error || '삭제 실패');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        불러오는 중...
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Sub header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/board')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← 게시판으로
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* Post Header */}
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            {post.isPinned && (
              <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">공지</span>
            )}
            <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          </div>
          <h1 className="text-xl font-bold mb-3 leading-snug">{post.title}</h1>
          <div className="flex items-center justify-between text-sm text-gray-400 border-b border-gray-800 pb-3 mb-4">
            <div className="flex gap-3">
              <span className="font-medium text-gray-200">{post.nickname}</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
            <div className="flex gap-3">
              <span>조회 {post.views.toLocaleString()}</span>
              <span>댓글 {post.comments.length}</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-gray-100 text-sm leading-7 whitespace-pre-wrap min-h-[80px]">
            {post.content}
          </div>

          {/* 투표 */}
          {post.poll && (
            <PollCard
              poll={post.poll}
              onVote={handleVote}
              voteLoading={voteLoading}
            />
          )}

          {/* Like + Delete */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-medium transition-all ${
                liked
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-400'
              }`}
            >
              <span>♥</span>
              <span>{post.likes}</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="font-semibold text-sm">댓글 {post.comments.length}개</h2>
          </div>

          {post.comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">첫 번째 댓글을 작성해보세요!</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {post.comments.map(c => (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-200">{c.nickname}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{timeAgo(c.createdAt)}</span>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="hover:text-red-400 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-6 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleComment} className="px-5 py-4 border-t border-gray-800 space-y-2">
            <input
              type="text"
              value={commentNick}
              onChange={e => setCommentNick(e.target.value)}
              placeholder="닉네임"
              maxLength={30}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-2">
              <textarea
                ref={commentRef}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={2}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
              >
                등록
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">게시글 삭제</h3>
            <p className="text-sm text-gray-400">작성 시 사용한 닉네임을 입력하면 삭제됩니다.</p>
            <input
              type="text"
              value={deleteNick}
              onChange={e => setDeleteNick(e.target.value)}
              placeholder="닉네임"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm"
              >
                취소
              </button>
              <button
                onClick={handleDeletePost}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
