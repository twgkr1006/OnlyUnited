import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CATEGORIES = [
  { value: 'FREE', label: '자유' },
  { value: 'MATCH', label: '경기분석' },
  { value: 'PLAYER', label: '선수' },
  { value: 'TRANSFER', label: '이적/소식' },
  { value: 'HUMOR', label: '유머' },
  { value: 'VOTE', label: '투표' },
];

function getNickname() {
  return localStorage.getItem('ou_nickname') || '';
}
function saveNickname(n: string) {
  localStorage.setItem('ou_nickname', n);
}

export default function WritePostPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(getNickname());
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('FREE');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 투표 관련 상태
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const addOption = () => {
    if (pollOptions.length >= 6) return;
    setPollOptions(prev => [...prev, '']);
  };
  const removeOption = (idx: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(prev => prev.filter((_, i) => i !== idx));
  };
  const updateOption = (idx: number, val: string) => {
    setPollOptions(prev => prev.map((o, i) => (i === idx ? val : o)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('제목을 입력해주세요.');
    if (!content.trim()) return alert('내용을 입력해주세요.');
    if (!nickname.trim()) return alert('닉네임을 입력해주세요.');
    if (hasPoll) {
      if (!pollQuestion.trim()) return alert('투표 질문을 입력해주세요.');
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length < 2) return alert('투표 항목을 최소 2개 입력해주세요.');
    }

    setSubmitting(true);
    saveNickname(nickname);
    try {
      const payload: any = { title, content, nickname, category };
      if (hasPoll) {
        payload.pollQuestion = pollQuestion;
        payload.pollOptions = pollOptions.filter(o => o.trim());
      }
      const r = await axios.post('/api/board', payload);
      navigate(`/board/${r.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || '작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Sub header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/board')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← 게시판으로
          </button>
          <h1 className="text-sm font-semibold text-gray-200">새 게시글 작성</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-5 space-y-4">
          {/* Nickname + Category */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="닉네임 입력"
                maxLength={30}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs text-gray-400 mb-1">카테고리</label>
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  if (e.target.value === 'VOTE') setHasPoll(true);
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={200}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
            <p className="text-right text-xs text-gray-600 mt-1">{title.length}/200</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요..."
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-500"
            />
          </div>

          {/* 투표 토글 */}
          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setHasPoll(p => !p)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                hasPoll ? 'bg-red-900/40 text-red-300' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span>투표 추가하기</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${hasPoll ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {hasPoll ? 'ON' : 'OFF'}
              </span>
            </button>

            {hasPoll && (
              <div className="p-4 space-y-3 bg-gray-800/50">
                {/* 투표 질문 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">투표 질문</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    placeholder="예: 이번 시즌 최고의 선수는?"
                    maxLength={200}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 투표 항목들 */}
                <div className="space-y-2">
                  <label className="block text-xs text-gray-400">투표 항목 (최소 2개, 최대 6개)</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => updateOption(idx, e.target.value)}
                        placeholder={`항목 ${idx + 1}`}
                        maxLength={100}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-700 hover:bg-red-800 text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="w-full py-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm transition-colors"
                    >
                      + 항목 추가
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => navigate('/board')}
              className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {submitting ? '등록 중...' : '게시글 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
