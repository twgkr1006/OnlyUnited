import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import teamNameKoMap from '../constants/TeamNameKoMap';

const MAN_UTD_FD_ID = 66;

interface Match {
  id: string;
  utcDate: string;
  homeTeam: string;
  homeTeamId: number;
  awayTeam: string;
  awayTeamId: number;
  status: string;
  competition: string;
  homeScore: number | null;
  awayScore: number | null;
  matchday: number | null;
}

const COMP_COLORS: Record<string, string> = {
  'Premier League':      'bg-purple-800 text-purple-200',
  'UEFA Champions League':'bg-blue-800 text-blue-200',
  'FA Cup':              'bg-red-800 text-red-200',
  'EFL Cup':             'bg-green-800 text-green-200',
  'UEFA Europa League':  'bg-orange-800 text-orange-200',
  'Community Shield':    'bg-yellow-700 text-yellow-100',
};
const COMP_SHORT: Record<string, string> = {
  'Premier League':      'EPL',
  'UEFA Champions League':'UCL',
  'FA Cup':              'FA',
  'EFL Cup':             'EFL',
  'UEFA Europa League':  'UEL',
  'Community Shield':    'CS',
};

const getTeamName  = (id: number, name: string) => teamNameKoMap[id] || name;
const getTeamCrest = (id: number) => `https://crests.football-data.org/${id}.png`;

function getResult(m: Match): 'W' | 'D' | 'L' | null {
  if (m.homeScore == null || m.awayScore == null) return null;
  const isHome = m.homeTeamId === MAN_UTD_FD_ID;
  const my = isHome ? m.homeScore : m.awayScore;
  const op = isHome ? m.awayScore : m.homeScore;
  return my > op ? 'W' : my < op ? 'L' : 'D';
}

const RESULT_META = {
  W: { label: '승', textColor: 'text-green-400',  border: 'border-l-green-500',  bg: 'bg-green-500/10' },
  D: { label: '무', textColor: 'text-yellow-400', border: 'border-l-yellow-500', bg: 'bg-yellow-500/10' },
  L: { label: '패', textColor: 'text-red-400',    border: 'border-l-red-500',    bg: 'bg-red-500/10'   },
};

const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAYS_KO   = ['일','월','화','수','목','금','토'];

function formatDate(iso: string) {
  const d = new Date(iso);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${mm}.${dd} (${DAYS_KO[d.getDay()]})`;
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return `${y}년 ${MONTHS_KO[parseInt(m) - 1]}`;
}

// ── Form string (last 5) ─────────────────────────────────────────────────────
function buildForm(matches: Match[]): ('W' | 'D' | 'L')[] {
  return matches
    .filter(m => m.status === 'FINISHED')
    .slice(-5)
    .map(m => getResult(m)!)
    .filter(Boolean);
}

export default function SeasonPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/matches/season')
      .then(r => {
        const list: Match[] = r.data.matches ?? [];
        setMatches(list);
        // 현재 달 또는 가장 최근 경기 달로 초기 포커스
        const now = new Date();
        const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const keys = [...new Set(list.map(m => monthKey(m.utcDate)))];
        setActiveMonth(keys.includes(curKey) ? curKey : (keys[keys.length - 1] ?? null));
      })
      .finally(() => setLoading(false));
  }, []);

  // 전체 시즌 스탯
  const finished = matches.filter(m => m.status === 'FINISHED');
  const wins   = finished.filter(m => getResult(m) === 'W').length;
  const draws  = finished.filter(m => getResult(m) === 'D').length;
  const losses = finished.filter(m => getResult(m) === 'L').length;
  const goalsFor  = finished.reduce((s, m) => {
    const isHome = m.homeTeamId === MAN_UTD_FD_ID;
    return s + (isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0));
  }, 0);
  const goalsAgainst = finished.reduce((s, m) => {
    const isHome = m.homeTeamId === MAN_UTD_FD_ID;
    return s + (isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0));
  }, 0);
  const form = buildForm(matches);
  const upcoming = matches.filter(m => m.status !== 'FINISHED');

  // 월별 그룹
  const monthKeys = [...new Set(matches.map(m => monthKey(m.utcDate)))];
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const k = monthKey(m.utcDate);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(m);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pb-16">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-4 pt-5 pb-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-red-300 text-xs mb-1">2025/26 시즌</p>
          <h1 className="text-xl font-bold mb-4">시즌 타임라인</h1>

          {/* 시즌 요약 */}
          {!loading && (
            <div className="grid grid-cols-2 gap-3">
              {/* W/D/L */}
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-red-200 mb-2">{finished.length}경기 완료</p>
                <div className="flex items-end gap-2">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-black text-green-400">{wins}</div>
                    <div className="text-xs text-gray-400">승</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-black text-yellow-400">{draws}</div>
                    <div className="text-xs text-gray-400">무</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-black text-red-400">{losses}</div>
                    <div className="text-xs text-gray-400">패</div>
                  </div>
                </div>
                {/* W/D/L 바 */}
                <div className="mt-2 flex rounded-full overflow-hidden h-2 gap-px">
                  {finished.length > 0 && <>
                    <div className="bg-green-500 transition-all" style={{ width: `${(wins / finished.length) * 100}%` }} />
                    <div className="bg-yellow-500 transition-all" style={{ width: `${(draws / finished.length) * 100}%` }} />
                    <div className="bg-red-500 transition-all"   style={{ width: `${(losses / finished.length) * 100}%` }} />
                  </>}
                </div>
              </div>

              {/* 득실·폼 */}
              <div className="bg-white/10 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">득점</span>
                  <span className="font-bold text-white">{goalsFor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">실점</span>
                  <span className="font-bold text-white">{goalsAgainst}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">득실차</span>
                  <span className={`font-bold ${goalsFor - goalsAgainst >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {goalsFor - goalsAgainst >= 0 ? '+' : ''}{goalsFor - goalsAgainst}
                  </span>
                </div>
                {/* 최근 폼 */}
                {form.length > 0 && (
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-xs text-gray-500 mr-1">최근</span>
                    {form.map((r, i) => (
                      <span key={i} className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                        r === 'W' ? 'bg-green-600 text-white' :
                        r === 'D' ? 'bg-yellow-600 text-white' :
                                    'bg-red-700 text-white'
                      }`}>{r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 다음 경기 프리뷰 */}
          {upcoming.length > 0 && (
            <div className="mt-3 bg-white/10 rounded-xl p-3">
              <p className="text-xs text-red-200 mb-1.5">다음 경기</p>
              {(() => {
                const next = upcoming[0];
                const isHome = next.homeTeamId === MAN_UTD_FD_ID;
                const oppId   = isHome ? next.awayTeamId : next.homeTeamId;
                const oppName = isHome ? next.awayTeam : next.homeTeam;
                const d = new Date(next.utcDate);
                return (
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/matches/${next.id}`)}>
                    <img src={getTeamCrest(oppId)} alt={oppName} className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">vs {getTeamName(oppId, oppName)}</div>
                      <div className="text-red-200 text-xs">{formatDate(next.utcDate)} · {isHome ? '홈' : '원정'}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${COMP_COLORS[next.competition] ?? 'bg-gray-700 text-gray-300'}`}>
                      {COMP_SHORT[next.competition] ?? next.competition.slice(0, 3)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-[#272727] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* 월 탭 */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              <button
                onClick={() => setActiveMonth(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeMonth === null ? 'bg-red-600 text-white' : 'bg-[#272727] text-gray-400 hover:text-white'
                }`}
              >
                전체
              </button>
              {monthKeys.map(k => (
                <button
                  key={k}
                  onClick={() => setActiveMonth(k)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeMonth === k ? 'bg-red-600 text-white' : 'bg-[#272727] text-gray-400 hover:text-white'
                  }`}
                >
                  {monthLabel(k)}
                </button>
              ))}
            </div>

            {/* 경기 목록 (월별 그룹) */}
            <div className="space-y-6">
              {(activeMonth ? [activeMonth] : monthKeys).map(mk => {
                const monthMatches = grouped[mk] ?? [];
                const mWins   = monthMatches.filter(m => getResult(m) === 'W').length;
                const mDraws  = monthMatches.filter(m => getResult(m) === 'D').length;
                const mLosses = monthMatches.filter(m => getResult(m) === 'L').length;
                const mDone   = monthMatches.filter(m => m.status === 'FINISHED').length;

                return (
                  <div key={mk}>
                    {/* 월 헤더 */}
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-sm font-bold text-gray-200">{monthLabel(mk)}</h2>
                      {mDone > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          {mWins > 0   && <span className="text-green-500">{mWins}승</span>}
                          {mDraws > 0  && <span className="text-yellow-500">{mDraws}무</span>}
                          {mLosses > 0 && <span className="text-red-500">{mLosses}패</span>}
                        </div>
                      )}
                      <div className="flex-1 h-px bg-[#333]" />
                    </div>

                    {/* 이달의 경기 카드들 */}
                    <div className="space-y-2">
                      {monthMatches.map(m => {
                        const result = getResult(m);
                        const isHome = m.homeTeamId === MAN_UTD_FD_ID;
                        const oppId   = isHome ? m.awayTeamId : m.homeTeamId;
                        const oppName = isHome ? m.awayTeam   : m.homeTeam;
                        const myScore = isHome ? m.homeScore : m.awayScore;
                        const opScore = isHome ? m.awayScore : m.homeScore;
                        const isFinished = m.status === 'FINISHED';
                        const meta = result ? RESULT_META[result] : null;

                        return (
                          <button
                            key={m.id}
                            onClick={() => navigate(`/matches/${m.id}`)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 transition-all text-left ${
                              meta
                                ? `${meta.border} ${meta.bg} hover:brightness-110`
                                : 'border-l-gray-700 bg-[#272727] hover:bg-[#2e2e2e]'
                            }`}
                          >
                            {/* 날짜 */}
                            <div className="w-16 flex-shrink-0">
                              <div className="text-xs font-medium text-gray-300">{formatDate(m.utcDate)}</div>
                              <div className="text-[10px] text-gray-600 mt-0.5">{isHome ? '홈' : '원정'}</div>
                            </div>

                            {/* 상대팀 */}
                            <img
                              src={getTeamCrest(oppId)}
                              alt={oppName}
                              className="w-7 h-7 object-contain flex-shrink-0"
                              onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                            />
                            <span className="flex-1 text-sm font-medium text-white truncate min-w-0">
                              {getTeamName(oppId, oppName)}
                            </span>

                            {/* 스코어 or 예정 */}
                            {isFinished ? (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-lg font-black tabular-nums text-white">
                                  {myScore} - {opScore}
                                </span>
                                {meta && (
                                  <span className={`text-xs font-bold w-5 h-5 rounded flex items-center justify-center ${
                                    result === 'W' ? 'bg-green-600 text-white' :
                                    result === 'D' ? 'bg-yellow-600 text-white' :
                                                     'bg-red-700 text-white'
                                  }`}>
                                    {meta.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 flex-shrink-0">
                                {new Date(m.utcDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}

                            {/* 대회 배지 */}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${COMP_COLORS[m.competition] ?? 'bg-gray-700 text-gray-300'}`}>
                              {COMP_SHORT[m.competition] ?? m.competition.slice(0, 3)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
