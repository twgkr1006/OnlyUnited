import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import teamNameKoMap from '../constants/TeamNameKoMap';

// ── 이름 정규화 (특수문자 제거, 소문자) ───────────────────────────────────────
function normName(s: string) {
    return s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[ıİ]/g, 'i').replace(/[ğĞ]/g, 'g')
        .replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c')
        .replace(/[^\w\s]/g, '').trim();
}

// ESPN 선수 이름 → DB playerId 룩업 맵 생성
function buildPlayerIdMap(squad: { playerId: number; name: string }[]) {
    const map: Record<string, number> = {};
    for (const p of squad) {
        const norm = normName(p.name);
        map[norm] = p.playerId;
    }
    return map;
}

// ESPN 이름으로 playerId 검색 (퍼지)
function findPlayerId(playerIdMap: Record<string, number>, espnName: string): number | null {
    const norm = normName(espnName);
    // 1) 정확히
    if (playerIdMap[norm] !== undefined) return playerIdMap[norm];
    // 2) 성(last word)으로 매칭
    const lastName = norm.split(' ').pop() ?? '';
    if (lastName.length >= 4) {
        for (const [key, pid] of Object.entries(playerIdMap)) {
            if (key.includes(lastName)) return pid;
        }
    }
    return null;
}

const MAN_UTD_FD_ID = 66;
const MAN_UTD_ESPN_ID = '360';

// ── 타입 ─────────────────────────────────────────────────────────────────────
interface MatchInfo {
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

interface FdBasic {
    halfTime: { home: number | null; away: number | null } | null;
    homeTeamCrest: string | null;
    awayTeamCrest: string | null;
    homeTla: string | null;
    awayTla: string | null;
}

interface EspnEvent {
    minute: string;
    type: string;    // 'GOAL' | 'OWN_GOAL' | 'PENALTY' | 'Yellow Card' | 'Red Card' | ...
    kind: 'goal' | 'card';
    teamId: string;
    teamName: string;
    scorer: string | null;
    assist: string | null;
    text: string;
}

interface StatEntry { value: string; label: string }
interface TeamStat {
    teamId: string;
    teamName: string;
    homeAway: 'home' | 'away';
    logo: string;
    stats: Record<string, StatEntry>;
}

interface RosterPlayer {
    id: string;
    name: string;
    jersey: string;
    position: string;
    starter: boolean;
    subbedIn: boolean;
    subbedOut: boolean;
    stats: Record<string, string>;
}

interface EspnData {
    events: EspnEvent[];
    teamStats: TeamStat[] | null;
    rosters: RosterPlayer[] | null;
    venue: string | null;
    officials: { name: string; role: string }[];
}

interface DetailData {
    match: MatchInfo;
    fdBasic: FdBasic | null;
    espn: EspnData | null;
}

interface FanRating {
    fanAvg:   number;
    count:    number;
    myRating: number | null;
}
type RatingsMap = Record<string, FanRating>; // playerName → FanRating

interface Highlight {
    videoId:     string;
    title:       string;
    channelName: string;
    thumb:       string;
    publishedAt: string;
}

function getClientId() {
    let id = localStorage.getItem('ou_client_id');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('ou_client_id', id); }
    return id;
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────
const getTeamCrest = (id: number) => `https://crests.football-data.org/${id}.png`;
const getTeamName = (id: number, name: string) => teamNameKoMap[id] || name;

const formatDatetime = (d: string) => {
    const dt = new Date(d);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const hh = dt.getHours().toString().padStart(2, '0');
    const mm = dt.getMinutes().toString().padStart(2, '0');
    return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일 (${days[dt.getDay()]}) ${hh}:${mm}`;
};

const getResult = (m: MatchInfo) => {
    if (m.homeScore == null || m.awayScore == null) return null;
    const isHome = m.homeTeamId === MAN_UTD_FD_ID;
    const my = isHome ? m.homeScore : m.awayScore;
    const op = isHome ? m.awayScore : m.homeScore;
    return my > op ? '승' : my < op ? '패' : '무';
};

// ── 팀 스탯 비교 막대 ────────────────────────────────────────────────────────
const STAT_KEYS: { key: string; label: string; percent?: boolean }[] = [
    { key: 'totalShots',     label: '슈팅' },
    { key: 'shotsOnTarget',  label: '유효슈팅' },
    { key: 'possessionPct',  label: '점유율', percent: true },
    { key: 'totalPasses',    label: '패스 횟수' },
    { key: 'passPct',        label: '패스 성공률', percent: true },
    { key: 'foulsCommitted', label: '파울' },
    { key: 'yellowCards',    label: '옐로우 카드' },
    { key: 'redCards',       label: '레드 카드' },
    { key: 'offsides',       label: '오프사이드' },
    { key: 'wonCorners',     label: '코너킥' },
];

const StatBar = ({
    label, homeVal, awayVal, percent,
}: { label: string; homeVal: string | null; awayVal: string | null; percent?: boolean }) => {
    const toNum = (v: string | null) => {
        if (!v) return 0;
        const s = String(v).replace('%', '');
        return parseFloat(s) || 0;
    };
    const h = toNum(homeVal);
    const a = toNum(awayVal);
    const total = h + a || 1;
    const hPct = percent ? h : (h / total) * 100;
    const aPct = percent ? a : (a / total) * 100;
    const hWins = h > a;
    const aWins = a > h;

    const fmt = (v: string | null) => {
        if (!v) return '-';
        if (percent) return `${parseFloat(v) > 1 ? parseFloat(v).toFixed(1) : (parseFloat(v) * 100).toFixed(0)}%`;
        return v;
    };

    return (
        <div className="py-2.5 px-1">
            <div className="flex justify-between items-center mb-1.5 text-sm">
                <span className={`font-bold w-14 text-left tabular-nums ${hWins ? 'text-white' : 'text-gray-400'}`}>
                    {fmt(homeVal)}
                </span>
                <span className="text-gray-500 text-xs text-center flex-1">{label}</span>
                <span className={`font-bold w-14 text-right tabular-nums ${aWins ? 'text-white' : 'text-gray-400'}`}>
                    {fmt(awayVal)}
                </span>
            </div>
            <div className="flex items-center gap-1 h-2">
                <div className="flex-1 flex justify-end">
                    <div
                        className={`h-full rounded-full transition-all ${hWins ? 'bg-red-500' : 'bg-gray-600'}`}
                        style={{ width: `${Math.min(hPct, 100)}%` }}
                    />
                </div>
                <div className="w-px h-3 bg-gray-600 shrink-0" />
                <div className="flex-1 flex justify-start">
                    <div
                        className={`h-full rounded-full transition-all ${aWins ? 'bg-red-500' : 'bg-gray-600'}`}
                        style={{ width: `${Math.min(aPct, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// ── 경기 이벤트 아이콘 ────────────────────────────────────────────────────────
const EventIcon = ({ type, kind }: { type: string; kind: string }) => {
    if (kind === 'goal') {
        if (type === 'OWN_GOAL') return <span className="text-base">⚽</span>;
        if (type === 'PENALTY') return <span className="text-base">⚽🅿️</span>;
        return <span className="text-base">⚽</span>;
    }
    if (type.toLowerCase().includes('red')) return (
        <span className="inline-block w-3.5 h-5 bg-red-600 rounded-sm align-middle" />
    );
    return <span className="inline-block w-3.5 h-5 bg-yellow-400 rounded-sm align-middle" />;
};

// ── 스켈레톤 ─────────────────────────────────────────────────────────────────
// ── 채널 배지 ─────────────────────────────────────────────────────────────────
const CHANNEL_BADGE: Record<string, { label: string; cls: string }> = {
    spotv:           { label: 'SPOTV',  cls: 'bg-red-700 text-white' },
    '스포티비':       { label: 'SPOTV',  cls: 'bg-red-700 text-white' },
    'manchester united': { label: '맨유 공식', cls: 'bg-red-900 text-red-200 border border-red-700/40' },
    'premier league':    { label: 'PL 공식',  cls: 'bg-purple-900 text-purple-200 border border-purple-700/40' },
};

const ChannelBadge = ({ name }: { name: string }) => {
    const key = Object.keys(CHANNEL_BADGE).find(k => name.toLowerCase().includes(k));
    const badge = key ? CHANNEL_BADGE[key] : null;
    return (
        <span className="flex items-center gap-1.5">
            {badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
                    {badge.label}
                </span>
            )}
            <span className="text-[10px] text-gray-500">{name}</span>
        </span>
    );
};

const Skeleton = () => (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col">
        <header className="sticky top-0 z-30 bg-[#1a1a1a] border-b border-white/10 px-4 py-3 flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded animate-pulse" />
            <div className="w-24 h-6 bg-gray-700 rounded animate-pulse" />
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 w-full space-y-4">
            <div className="bg-[#2a2a2a] rounded-2xl h-52 animate-pulse" />
            <div className="bg-[#2a2a2a] rounded-2xl h-40 animate-pulse" />
            <div className="bg-[#2a2a2a] rounded-2xl h-64 animate-pulse" />
        </div>
    </div>
);

// ── 메인 ─────────────────────────────────────────────────────────────────────
const MatchDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playerIdMap, setPlayerIdMap] = useState<Record<string, number>>({});
    const [ratingsMap, setRatingsMap] = useState<RatingsMap>({});
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [hlLoading, setHlLoading] = useState(false);
    const [hlSource, setHlSource] = useState<string>('');
    const [hlVideoInput, setHlVideoInput] = useState('');
    const [hlAdding, setHlAdding] = useState(false);
    const [activeHl, setActiveHl] = useState<number>(0);
    const clientId = getClientId();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            axios.get(`/api/matches/${id}/detail`),
            axios.get('/api/squad'),
            axios.get(`/api/matches/${id}/ratings`, { params: { clientId } }),
        ]).then(([matchRes, squadRes, ratingsRes]) => {
            setData(matchRes.data);
            const squad = squadRes.data?.squad ?? [];
            setPlayerIdMap(buildPlayerIdMap(squad));
            setRatingsMap(ratingsRes.data.ratings ?? {});
        }).catch(() => setError('경기 정보를 불러오지 못했습니다.'))
          .finally(() => setLoading(false));
    }, [id]);

    const fetchHighlights = useCallback(async (refresh = false) => {
        if (!id) return;
        setHlLoading(true);
        try {
            if (refresh) {
                const res = await axios.post(`/api/matches/${id}/highlights`);
                setHighlights(res.data.highlights ?? []);
                setHlSource(res.data.source ?? '');
            } else {
                const res = await axios.get(`/api/matches/${id}/highlights`);
                setHighlights(res.data.highlights ?? []);
                setHlSource(res.data.source ?? '');
            }
        } catch {}
        setHlLoading(false);
    }, [id]);

    useEffect(() => {
        if (id) fetchHighlights(false);
    }, [id]);

    const handleAddHighlight = useCallback(async () => {
        if (!id || !hlVideoInput.trim()) return;
        setHlAdding(true);
        try {
            const res = await axios.post(`/api/matches/${id}/highlights`, { videoUrl: hlVideoInput.trim() });
            setHighlights(res.data.highlights ?? []);
            setHlVideoInput('');
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
            alert(msg ?? '추가 실패');
        }
        setHlAdding(false);
    }, [id, hlVideoInput]);

    const handleRate = useCallback(async (playerName: string, rating: number) => {
        if (!id) return;
        try {
            const r = await axios.post(`/api/matches/${id}/ratings`, { clientId, playerName, rating });
            setRatingsMap(prev => ({
                ...prev,
                [playerName]: { fanAvg: r.data.fanAvg, count: r.data.count, myRating: r.data.myRating },
            }));
        } catch (e) { console.error(e); }
    }, [id, clientId]);

    if (loading) return <Skeleton />;

    if (error || !data) return (
        <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center gap-4 text-gray-400">
            <p>{error ?? '데이터 없음'}</p>
            <button onClick={() => navigate(-1)} className="text-red-400 hover:text-red-300 text-sm">← 돌아가기</button>
        </div>
    );

    const { match, fdBasic, espn } = data;
    const result = getResult(match);
    const isFinished = match.status === 'FINISHED';
    const isHome = match.homeTeamId === MAN_UTD_FD_ID;

    const homeCrest = fdBasic?.homeTeamCrest ?? getTeamCrest(match.homeTeamId);
    const awayCrest = fdBasic?.awayTeamCrest ?? getTeamCrest(match.awayTeamId);
    const homeName  = getTeamName(match.homeTeamId, match.homeTeam);
    const awayName  = getTeamName(match.awayTeamId, match.awayTeam);

    // 팀 스탯 — homeAway 기준으로 홈/어웨이 분리
    const homeStatTeam = espn?.teamStats?.find(t => t.homeAway === 'home') ?? null;
    const awayStatTeam = espn?.teamStats?.find(t => t.homeAway === 'away') ?? null;
    const hasStats = !!(homeStatTeam && awayStatTeam);

    // 경기 이벤트 — 맨유 ESPN ID 기준
    const events = espn?.events ?? [];
    const manUtdEvents = events.filter(e => e.teamId === MAN_UTD_ESPN_ID);
    const oppEvents    = events.filter(e => e.teamId !== MAN_UTD_ESPN_ID);

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-white">

            {/* 헤더 */}
            <header className="sticky top-0 z-30 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <Logo className="h-7" />
                <span className="text-gray-500 text-xs ml-1">{match.competition}</span>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

                {/* ── 스코어 카드 ────────────────────────────────────────── */}
                <div className="bg-gradient-to-br from-[#2c1a1a] to-[#222] border border-red-900/30 rounded-2xl p-5">
                    <div className="text-center mb-4">
                        <p className="text-xs text-gray-500">
                            {match.matchday ? `${match.matchday}라운드 · ` : ''}{match.competition}
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">{formatDatetime(match.utcDate)}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        {/* 홈팀 */}
                        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                            <img src={homeCrest} alt={homeName}
                                className="w-16 h-16 object-contain drop-shadow"
                                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                            <span className="text-sm font-semibold text-center leading-tight line-clamp-2">{homeName}</span>
                        </div>

                        {/* 스코어 */}
                        <div className="flex flex-col items-center shrink-0">
                            {isFinished ? (
                                <>
                                    <div className="text-5xl font-black tracking-tight flex items-center gap-2">
                                        <span className={isHome && (match.homeScore ?? 0) < (match.awayScore ?? 0) ? 'text-gray-500' : 'text-white'}>
                                            {match.homeScore}
                                        </span>
                                        <span className="text-gray-600 text-3xl">-</span>
                                        <span className={!isHome && (match.awayScore ?? 0) < (match.homeScore ?? 0) ? 'text-gray-500' : 'text-white'}>
                                            {match.awayScore}
                                        </span>
                                    </div>
                                    {fdBasic?.halfTime && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            전반 {fdBasic.halfTime.home} - {fdBasic.halfTime.away}
                                        </p>
                                    )}
                                    {result && (
                                        <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${
                                            result === '승' ? 'bg-green-800 text-green-200'
                                            : result === '패' ? 'bg-red-900 text-red-200'
                                            : 'bg-yellow-800 text-yellow-200'
                                        }`}>맨유 {result}</span>
                                    )}
                                </>
                            ) : (
                                <div className="text-center px-4">
                                    <div className="text-3xl font-black text-gray-500">VS</div>
                                    <div className="text-xs text-gray-600 mt-1">예정</div>
                                </div>
                            )}
                        </div>

                        {/* 어웨이팀 */}
                        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                            <img src={awayCrest} alt={awayName}
                                className="w-16 h-16 object-contain drop-shadow"
                                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                            <span className="text-sm font-semibold text-center leading-tight line-clamp-2">{awayName}</span>
                        </div>
                    </div>

                    {/* 경기장 · 심판 */}
                    <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-gray-500">
                        {(espn?.venue ?? null) && (
                            <span>📍 {espn!.venue}</span>
                        )}
                        {espn?.officials?.map((o, i) => (
                            <span key={i}>🏁 {o.name}</span>
                        ))}
                    </div>
                </div>

                {/* ── 하이라이트 ───────────────────────────────────────── */}
                <div className="bg-[#252525] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-base">▶️</span>
                            <span className="text-sm font-bold text-gray-200">하이라이트</span>
                            {highlights.length > 0 && (
                                <span className="text-xs text-gray-500">{highlights.length}개</span>
                            )}
                        </div>
                        <button
                            onClick={() => fetchHighlights(true)}
                            disabled={hlLoading}
                            className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40 flex items-center gap-1"
                        >
                            {hlLoading ? (
                                <span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                            ) : '🔄'}
                            새로고침
                        </button>
                    </div>

                    {hlLoading && highlights.length === 0 ? (
                        <div className="flex items-center justify-center py-10 gap-2 text-gray-500 text-sm">
                            <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
                            YouTube에서 검색 중...
                        </div>
                    ) : highlights.length > 0 ? (
                        <div>
                            {/* 탭 선택 */}
                            {highlights.length > 1 && (
                                <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto">
                                    {highlights.map((h, i) => (
                                        <button
                                            key={h.videoId}
                                            onClick={() => setActiveHl(i)}
                                            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                                activeHl === i
                                                    ? 'bg-red-700 text-white'
                                                    : 'bg-[#1e1e1e] text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <img src={h.thumb} alt="" className="w-10 h-6 object-cover rounded" />
                                            <span className="max-w-[80px] truncate">{h.channelName || `영상 ${i+1}`}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* YouTube 임베드 */}
                            {highlights[activeHl] && (
                                <div className="px-4 pt-3 pb-2">
                                    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                                        <iframe
                                            key={highlights[activeHl].videoId}
                                            src={`https://www.youtube.com/embed/${highlights[activeHl].videoId}?rel=0&modestbranding=1`}
                                            title={highlights[activeHl].title}
                                            allowFullScreen
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            className="absolute inset-0 w-full h-full"
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-300 line-clamp-2 leading-relaxed">{highlights[activeHl].title}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <ChannelBadge name={highlights[activeHl].channelName} />
                                        <a
                                            href={`https://www.youtube.com/watch?v=${highlights[activeHl].videoId}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                                        >
                                            YouTube에서 보기 →
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-5 py-5 text-center">
                            <p className="text-gray-500 text-sm">아직 하이라이트 영상이 없습니다.</p>
                            <p className="text-gray-600 text-xs mt-1">경기 후 자동으로 찾거나 아래에 URL을 붙여넣으세요.</p>
                        </div>
                    )}

                    {/* 직접 URL 추가 */}
                    <div className="px-4 pb-4 pt-2 border-t border-white/5 flex gap-2">
                        <input
                            type="text"
                            value={hlVideoInput}
                            onChange={e => setHlVideoInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddHighlight()}
                            placeholder="YouTube URL 직접 추가 (youtu.be/... 또는 youtube.com/...)"
                            className="flex-1 bg-[#1a1a1a] text-xs text-white placeholder-gray-600 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-red-700"
                        />
                        <button
                            onClick={handleAddHighlight}
                            disabled={hlAdding || !hlVideoInput.trim()}
                            className="shrink-0 text-xs bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                            {hlAdding ? '...' : '추가'}
                        </button>
                    </div>
                </div>

                {/* ── 경기 이벤트 (골 / 카드) ──────────────────────────── */}
                {isFinished && (
                    <div className="bg-[#252525] rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-200">경기 이벤트</span>
                            {events.length > 0 && (
                                <span className="text-xs text-gray-600 ml-auto">{events.filter(e => e.kind === 'goal').length}골</span>
                            )}
                        </div>

                        {events.length === 0 ? (
                            <div className="px-5 py-8 text-center text-gray-600 text-sm">
                                이벤트 데이터를 불러올 수 없습니다.
                            </div>
                        ) : (
                            <div className="px-4 py-2 space-y-1">
                                {events.map((ev, i) => {
                                    const isManUtd = ev.teamId === MAN_UTD_ESPN_ID;
                                    return (
                                        <div key={i} className={`flex items-start gap-3 py-2 px-3 rounded-xl text-sm ${
                                            isManUtd ? 'bg-red-950/20' : ''
                                        }`}>
                                            {/* 시간 */}
                                            <span className="text-gray-500 text-xs w-12 shrink-0 pt-0.5 tabular-nums">
                                                {ev.minute}
                                            </span>

                                            {isManUtd ? (
                                                /* 맨유 이벤트 — 왼쪽 정렬 */
                                                <>
                                                    <EventIcon type={ev.type} kind={ev.kind} />
                                                    <div>
                                                        <span className="font-semibold text-white">{ev.scorer}</span>
                                                        {ev.kind === 'goal' && ev.assist && (
                                                            <span className="text-gray-400 text-xs ml-2">어시스트: {ev.assist}</span>
                                                        )}
                                                        {ev.type === 'OWN_GOAL' && (
                                                            <span className="text-red-400 text-xs ml-2">(자책골)</span>
                                                        )}
                                                        {ev.type === 'PENALTY' && (
                                                            <span className="text-blue-400 text-xs ml-2">(PK)</span>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                /* 상대팀 이벤트 — 오른쪽 정렬 */
                                                <>
                                                    <div className="flex-1" />
                                                    <div className="text-right">
                                                        <span className="font-semibold text-gray-300">{ev.scorer}</span>
                                                        {ev.kind === 'goal' && ev.assist && (
                                                            <span className="text-gray-500 text-xs ml-2">어시스트: {ev.assist}</span>
                                                        )}
                                                    </div>
                                                    <EventIcon type={ev.type} kind={ev.kind} />
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 팀 통계 ──────────────────────────────────────────── */}
                {isFinished && (
                    <div className="bg-[#252525] rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <img src={homeCrest} className="w-5 h-5 object-contain" alt="" />
                                    <span className="text-xs text-gray-400">{fdBasic?.homeTla ?? 'HOME'}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-200">팀 기록</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{fdBasic?.awayTla ?? 'AWAY'}</span>
                                    <img src={awayCrest} className="w-5 h-5 object-contain" alt="" />
                                </div>
                            </div>
                        </div>

                        {!hasStats ? (
                            <div className="px-5 py-8 text-center text-gray-600 text-sm">
                                팀 통계를 불러오는 중이거나 데이터가 없습니다.
                            </div>
                        ) : (
                            <div className="px-4 py-2 divide-y divide-gray-800/60">
                                {STAT_KEYS.map(({ key, label, percent }) => {
                                    const hv = homeStatTeam!.stats[key]?.value ?? null;
                                    const av = awayStatTeam!.stats[key]?.value ?? null;
                                    if (!hv && !av) return null;
                                    return (
                                        <StatBar
                                            key={key}
                                            label={label}
                                            homeVal={hv}
                                            awayVal={av}
                                            percent={percent}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 맨유 선수 기록 ────────────────────────────────────── */}
                {isFinished && espn?.rosters && espn.rosters.length > 0 && (
                    <div className="bg-[#252525] rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                            <img src={getTeamCrest(MAN_UTD_FD_ID)} className="w-5 h-5 object-contain" alt="" />
                            <span className="text-sm font-bold text-gray-200">맨체스터 유나이티드</span>
                        </div>

                        {/* 선발 */}
                        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">선발</p>
                            <p className="text-[10px] text-gray-600">클릭 → 상세스탯 · 팬 평점</p>
                        </div>
                        <div>
                            {espn.rosters.filter(p => p.starter).map(p => (
                                <PlayerStatCard key={p.id} player={p} playerIdMap={playerIdMap} onNavigate={navigate}
                                    fanRating={ratingsMap[p.name] ?? null} onRate={handleRate} isFinished={isFinished} />
                            ))}
                        </div>

                        {/* 교체 */}
                        {espn.rosters.some(p => p.subbedIn) && (
                            <>
                                <div className="px-5 pt-4 pb-1">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">교체 투입</p>
                                </div>
                                <div>
                                    {espn.rosters.filter(p => p.subbedIn).map(p => (
                                        <PlayerStatCard key={p.id} player={p} playerIdMap={playerIdMap} onNavigate={navigate}
                                            fanRating={ratingsMap[p.name] ?? null} onRate={handleRate} isFinished={isFinished} />
                                    ))}
                                </div>
                            </>
                        )}
                        <div className="h-2" />
                    </div>
                )}

            </div>
        </div>
    );
};

// ── ESPN 스탯 키 → 한국어 라벨 + 카테고리 ───────────────────────────────────
const ESPN_STAT_MAP: Record<string, { label: string; group: 'attack' | 'pass' | 'defense' | 'etc' }> = {
    totalGoals:           { label: '골',          group: 'attack' },
    goalAssists:          { label: '어시스트',     group: 'attack' },
    totalShots:           { label: '슈팅',         group: 'attack' },
    shotsOnTarget:        { label: '유효슈팅',     group: 'attack' },
    successfulDribbles:   { label: '드리블 성공',  group: 'attack' },
    dribblesAttempted:    { label: '드리블 시도',  group: 'attack' },
    offsideCaught:        { label: '오프사이드',   group: 'attack' },
    keyPasses:            { label: '키패스',       group: 'pass' },
    totalPasses:          { label: '패스',         group: 'pass' },
    accuratePasses:       { label: '정확한 패스',  group: 'pass' },
    totalLongBalls:       { label: '롱볼',         group: 'pass' },
    totalCrossNocorner:   { label: '크로스',       group: 'pass' },
    totalTackles:         { label: '태클',         group: 'defense' },
    interceptions:        { label: '인터셉트',     group: 'defense' },
    blockedShots:         { label: '슈팅 차단',    group: 'defense' },
    totalClearances:      { label: '클리어링',     group: 'defense' },
    aerialDuelsWon:       { label: '공중볼 승',    group: 'defense' },
    saves:                { label: '선방',         group: 'defense' },
    goalsConceded:        { label: '실점',         group: 'defense' },
    minutesPlayed:        { label: '출전 시간',    group: 'etc' },
    foulsCommitted:       { label: '파울',         group: 'etc' },
    wasFouled:            { label: '파울 유도',    group: 'etc' },
    totalDuels:           { label: '듀얼',         group: 'etc' },
    duelsWon:             { label: '듀얼 승',      group: 'etc' },
    yellowCards:          { label: '경고',         group: 'etc' },
    redCards:             { label: '퇴장',         group: 'etc' },
};

const GROUP_META = {
    attack:  { label: '공격',  color: 'text-red-400',   border: 'border-red-800/60',   bg: 'bg-red-950/20'   },
    pass:    { label: '패스',  color: 'text-green-400', border: 'border-green-800/60', bg: 'bg-green-950/20' },
    defense: { label: '수비',  color: 'text-blue-400',  border: 'border-blue-800/60',  bg: 'bg-blue-950/20'  },
    etc:     { label: '기타',  color: 'text-gray-400',  border: 'border-gray-700/60',  bg: 'bg-gray-800/20'  },
} as const;

const ratingColor = (r: number) =>
    r >= 8.5 ? 'text-yellow-300 bg-yellow-900/50 ring-1 ring-yellow-600' :
    r >= 7.5 ? 'text-green-300 bg-green-900/50 ring-1 ring-green-700' :
    r >= 6.5 ? 'text-blue-300 bg-blue-900/50 ring-1 ring-blue-700' :
               'text-gray-300 bg-gray-800/60';

// ── 선수 스탯 카드 (확장형) ──────────────────────────────────────────────────
const PlayerStatCard = ({
    player,
    playerIdMap,
    onNavigate,
    fanRating,
    onRate,
    isFinished,
}: {
    player: RosterPlayer;
    playerIdMap: Record<string, number>;
    onNavigate: (path: string) => void;
    fanRating: FanRating | null;
    onRate: (playerName: string, rating: number) => void;
    isFinished: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const s = player.stats;
    const goals   = parseInt(s['totalGoals']   ?? '0') || 0;
    const assists = parseInt(s['goalAssists']  ?? '0') || 0;
    const yellow  = parseInt(s['yellowCards']  ?? '0') || 0;
    const red     = parseInt(s['redCards']     ?? '0') || 0;
    const saves   = parseInt(s['saves']        ?? '0') || 0;
    const minutes = s['minutesPlayed'] ? `${s['minutesPlayed']}'` : null;
    const ratingRaw = s['rating'];
    const ratingNum = ratingRaw ? parseFloat(ratingRaw) : null;

    const posColor: Record<string, string> = {
        G: 'text-yellow-400 bg-yellow-900/40',
        D: 'text-blue-400 bg-blue-900/40',
        M: 'text-green-400 bg-green-900/40',
        F: 'text-red-400 bg-red-900/40',
    };
    const posKey = player.position?.[0]?.toUpperCase() ?? 'M';
    const posClass = posColor[posKey] ?? 'text-gray-400 bg-gray-800/40';

    const playerId = findPlayerId(playerIdMap, player.name);
    const isLinked = playerId !== null;

    // 확장 스탯: ESPN_STAT_MAP에 있고 값이 0이 아닌 것들
    const statGroups: Record<string, { label: string; value: string }[]> = {
        attack: [], pass: [], defense: [], etc: [],
    };
    for (const [key, meta] of Object.entries(ESPN_STAT_MAP)) {
        const val = s[key];
        if (!val || val === '0' || val === '0.0') continue;
        statGroups[meta.group].push({ label: meta.label, value: val });
    }
    const hasDetailStats = Object.values(statGroups).some(g => g.length > 0);

    return (
        <div className="border-b border-gray-800/50 last:border-0">
            {/* 헤더 행 */}
            <div
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 cursor-pointer"
                onClick={() => setOpen(v => !v)}
            >
                <span className="text-gray-500 text-xs w-5 text-center shrink-0">{player.jersey}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${posClass}`}>
                    {player.position ?? '?'}
                </span>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white truncate">{player.name}</span>
                        {(player.subbedIn || player.subbedOut) && (
                            <span className="text-[10px] text-green-400 shrink-0">
                                {player.subbedIn ? '↑' : '↓'}
                            </span>
                        )}
                    </div>
                    {minutes && <span className="text-xs text-gray-600">{minutes}</span>}
                </div>

                {/* 뱃지 (골·어시·카드) */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {goals > 0 && (
                        <span className="text-xs font-bold bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">
                            ⚽ {goals}
                        </span>
                    )}
                    {assists > 0 && (
                        <span className="text-xs font-bold bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">
                            A {assists}
                        </span>
                    )}
                    {saves > 0 && (
                        <span className="text-xs font-bold bg-yellow-900/50 text-yellow-300 px-1.5 py-0.5 rounded">
                            S {saves}
                        </span>
                    )}
                    {yellow > 0 && <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-sm" />}
                    {red > 0    && <span className="inline-block w-2.5 h-3.5 bg-red-600 rounded-sm" />}
                </div>

                {/* 평점 */}
                {ratingNum !== null ? (
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg shrink-0 ${ratingColor(ratingNum)}`}>
                        {ratingNum.toFixed(1)}
                    </span>
                ) : (
                    <span className="w-12 shrink-0" />
                )}

                {/* 펼치기 화살표 */}
                <svg
                    className={`w-4 h-4 text-gray-600 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* 확장 패널 */}
            {open && (
                <div className="px-4 pb-4 bg-[#1c1c1c]">
                    {hasDetailStats ? (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {(Object.keys(statGroups) as (keyof typeof GROUP_META)[]).map(group => {
                                const items = statGroups[group];
                                if (items.length === 0) return null;
                                const meta = GROUP_META[group];
                                return (
                                    <div key={group} className={`rounded-xl border p-3 ${meta.border} ${meta.bg}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${meta.color}`}>
                                            {meta.label}
                                        </p>
                                        <div className="space-y-1.5">
                                            {items.map(({ label, value }) => (
                                                <div key={label} className="flex justify-between text-xs">
                                                    <span className="text-gray-400">{label}</span>
                                                    <span className="text-white font-semibold tabular-nums">
                                                        {label === '출전 시간' ? `${value}'` : value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600 py-3 text-center">세부 스탯 없음</p>
                    )}

                    {/* ── 팬 평점 섹션 ── */}
                    {isFinished && (
                        <div className="mt-3 rounded-xl border border-yellow-800/40 bg-yellow-950/20 p-3">
                            <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">팬 평점</p>

                            {/* ESPN 공식 평점 vs 팬 평점 비교 */}
                            {(ratingNum !== null || (fanRating && fanRating.count > 0)) && (
                                <div className="space-y-1.5 mb-3">
                                    {ratingNum !== null && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 w-14 flex-shrink-0">ESPN</span>
                                            <div className="flex-1 h-2 bg-[#333] rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${(ratingNum / 10) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-blue-300 w-8 text-right tabular-nums">{ratingNum.toFixed(1)}</span>
                                        </div>
                                    )}
                                    {fanRating && fanRating.count > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 w-14 flex-shrink-0">팬 평균</span>
                                            <div className="flex-1 h-2 bg-[#333] rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${(fanRating.fanAvg / 10) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-yellow-300 w-8 text-right tabular-nums">{fanRating.fanAvg.toFixed(1)}</span>
                                        </div>
                                    )}
                                    {fanRating && fanRating.count > 0 && (
                                        <p className="text-[10px] text-gray-600 text-right">{fanRating.count}명 참여</p>
                                    )}
                                </div>
                            )}

                            {/* 1~10 평점 버튼 */}
                            <div className="flex gap-1 flex-wrap">
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                                    const isSelected = fanRating?.myRating === n;
                                    const isHover    = hovered === n;
                                    const highlight  = isSelected || isHover;
                                    const colorClass =
                                        n <= 3  ? (highlight ? 'bg-red-600 text-white'    : 'bg-[#333] text-red-400 hover:bg-red-800/60') :
                                        n <= 6  ? (highlight ? 'bg-yellow-600 text-white'  : 'bg-[#333] text-yellow-400 hover:bg-yellow-800/60') :
                                                  (highlight ? 'bg-green-600 text-white'   : 'bg-[#333] text-green-400 hover:bg-green-800/60');
                                    return (
                                        <button
                                            key={n}
                                            disabled={submitting}
                                            onMouseEnter={() => setHovered(n)}
                                            onMouseLeave={() => setHovered(null)}
                                            onClick={async e => {
                                                e.stopPropagation();
                                                setSubmitting(true);
                                                await onRate(player.name, n);
                                                setSubmitting(false);
                                            }}
                                            className={`flex-1 min-w-[24px] py-1.5 rounded text-xs font-bold transition-all ${colorClass} ${isSelected ? 'ring-2 ring-white/40 scale-105' : ''}`}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                            {fanRating?.myRating && (
                                <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                                    내 평점: <span className="text-yellow-400 font-bold">{fanRating.myRating}</span>점 (다시 클릭하면 변경)
                                </p>
                            )}
                        </div>
                    )}

                    {/* 선수 상세 페이지 링크 */}
                    {isLinked && (
                        <button
                            onClick={e => { e.stopPropagation(); onNavigate(`/squad/${playerId}`); }}
                            className="mt-3 w-full py-2 rounded-lg bg-red-900/30 border border-red-800/50 text-red-300 text-xs font-medium hover:bg-red-900/50 transition-colors"
                        >
                            선수 상세 페이지 →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MatchDetailPage;
