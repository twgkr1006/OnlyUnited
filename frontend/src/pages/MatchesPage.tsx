import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import teamNameKoMap from '../constants/TeamNameKoMap';

const MAN_UTD_ID = 66;

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

const getTeamInfo = (id: number, name: string) => ({
    name: teamNameKoMap[id] || name,
    crest: `https://crests.football-data.org/${id}.png`,
});

const DAYS = ['\uc77c', '\uc6d4', '\ud654', '\uc218', '\ubaa9', '\uae08', '\ud1a0'];

const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}\ub144 ${dt.getMonth() + 1}\uc6d4 ${dt.getDate()}\uc77c (${DAYS[dt.getDay()]})`;
};

const getResult = (m: Match): '\uc2b9' | '\ud328' | '\ubb34' | null => {
    if (m.homeScore == null || m.awayScore == null) return null;
    const isHome = m.homeTeamId === MAN_UTD_ID;
    const my = isHome ? m.homeScore : m.awayScore;
    const op = isHome ? m.awayScore : m.homeScore;
    return my > op ? '\uc2b9' : my < op ? '\ud328' : '\ubb34';
};

const resultBadge = (r: string | null) => {
    if (!r) return null;
    const cls = r === '\uc2b9' ? 'bg-green-700 text-green-100'
        : r === '\ud328' ? 'bg-red-700 text-red-100'
        : 'bg-yellow-700 text-yellow-100';
    return <span className={`text-xs font-bold px-2 py-0.5 rounded ${cls}`}>{r}</span>;
};

const MatchCard = ({ m, onClick }: { m: Match; onClick: () => void }) => {
    const hi = getTeamInfo(m.homeTeamId, m.homeTeam);
    const ai = getTeamInfo(m.awayTeamId, m.awayTeam);
    const result = getResult(m);
    const isScheduled = m.status === 'TIMED' || m.status === 'SCHEDULED';
    const manUtdHome = m.homeTeamId === MAN_UTD_ID;

    return (
        <div
            onClick={onClick}
            className="bg-[#2e2d2d] hover:bg-[#3a3939] rounded-lg p-4 cursor-pointer transition-colors"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">{formatDate(m.utcDate)}</span>
                <div className="flex items-center gap-2">
                    {m.matchday && <span className="text-xs text-gray-500">{m.matchday}R</span>}
                    <span className="text-xs text-gray-500">{m.competition}</span>
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className={`flex items-center gap-3 flex-1 ${manUtdHome ? 'font-bold' : ''}`}>
                    <img src={hi.crest} className="w-10 h-10 object-contain flex-shrink-0"
                        onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
                    <span className={`text-sm ${manUtdHome ? 'text-white' : 'text-gray-300'}`}>{hi.name}</span>
                </div>
                <div className="text-center flex-shrink-0 flex flex-col items-center gap-1">
                    {isScheduled ? (
                        <span className="text-lg font-bold text-gray-400">VS</span>
                    ) : (
                        <>
                            <span className="text-2xl font-extrabold text-white">
                                {m.homeScore} : {m.awayScore}
                            </span>
                            {resultBadge(result)}
                        </>
                    )}
                </div>
                <div className={`flex items-center gap-3 flex-1 justify-end ${!manUtdHome ? 'font-bold' : ''}`}>
                    <span className={`text-sm text-right ${!manUtdHome ? 'text-white' : 'text-gray-300'}`}>{ai.name}</span>
                    <img src={ai.crest} className="w-10 h-10 object-contain flex-shrink-0"
                        onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
                </div>
            </div>
        </div>
    );
};

const MatchesPage = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [matches, setMatches] = useState<Match[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchMatches = useCallback(async (t: 'upcoming' | 'past', p: number) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/matches/all`, {
                params: { tab: t, page: p, limit: 10 }
            });
            setMatches(res.data.matches ?? []);
            setTotalPages(res.data.totalPages ?? 1);
            setTotal(res.data.total ?? 0);
        } catch {
            setMatches([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        fetchMatches(tab, 1);
    }, [tab, fetchMatches]);

    const changePage = (p: number) => {
        setPage(p);
        fetchMatches(tab, p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const Skeleton = () => (
        <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#2e2d2d] rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-3 bg-gray-600 rounded w-32" />
                        <div className="h-3 bg-gray-600 rounded w-20" />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gray-600 rounded" />
                            <div className="h-4 bg-gray-600 rounded w-20" />
                        </div>
                        <div className="h-6 bg-gray-600 rounded w-16" />
                        <div className="flex items-center gap-3 flex-1 justify-end">
                            <div className="h-4 bg-gray-600 rounded w-20" />
                            <div className="w-10 h-10 bg-gray-600 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen">
            <div className="pt-6 pb-4 flex justify-center">
                <Logo size="large" />
            </div>

            <div className="container mx-auto px-4 pb-10 max-w-3xl">
                <div className="bg-[#545454] rounded-lg p-4 mb-4 flex items-center gap-3">
                    <button onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-white text-sm transition-colors">
                        {'\u2190 \ud648\uc73c\ub85c'}
                    </button>
                    <span className="text-gray-600">|</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-red-600 rounded" />
                        <h1 className="text-xl font-bold text-white">{'\ub9e8\uc720 \uacbd\uae30 \uc77c\uc815'}</h1>
                    </div>
                    <span className="ml-auto text-gray-400 text-sm">{loading ? '...' : `${total}\uacbd\uae30`}</span>
                </div>

                <div className="bg-[#545454] rounded-lg p-3 mb-4 flex gap-2">
                    {(['upcoming', 'past'] as const).map(t => (
                        <button key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                tab === t ? 'bg-red-700 text-white' : 'bg-[#2e2d2d] text-gray-400 hover:text-white'
                            }`}
                        >
                            {t === 'upcoming' ? '\ud83d\uddd3 \uc608\uc815 \uacbd\uae30' : '\ud83d\udccb \uc9c0\ub09c \uacbd\uae30'}
                        </button>
                    ))}
                </div>

                <div className="bg-[#545454] rounded-lg p-4 space-y-3">
                    {loading ? <Skeleton /> : matches.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            {tab === 'upcoming' ? '\uc608\uc815\ub41c \uacbd\uae30\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.' : '\uc9c0\ub09c \uacbd\uae30 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.'}
                        </div>
                    ) : (
                        matches.map(m => (
                            <MatchCard key={m.id} m={m} onClick={() => navigate(`/matches/${m.id}`)} />
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4 flex-wrap">
                        <button onClick={() => changePage(Math.max(1, page - 1))} disabled={page === 1}
                            className="px-3 py-1.5 bg-[#2e2d2d] text-gray-300 rounded disabled:opacity-40 hover:bg-[#3a3939] text-sm">
                            {'?'}
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) => p === '...' ? (
                                <span key={`dots-${i}`} className="px-2 py-1.5 text-gray-500 text-sm">{'?'}</span>
                            ) : (
                                <button key={p} onClick={() => changePage(p as number)}
                                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                        page === p ? 'bg-red-700 text-white' : 'bg-[#2e2d2d] text-gray-300 hover:bg-[#3a3939]'
                                    }`}>{p}</button>
                            ))
                        }
                        <button onClick={() => changePage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                            className="px-3 py-1.5 bg-[#2e2d2d] text-gray-300 rounded disabled:opacity-40 hover:bg-[#3a3939] text-sm">
                            {'?'}
                        </button>
                    </div>
                )}
            </div>

            <div className="text-center text-gray-500 text-sm pb-6">� OnlyUnited All Rights Reserved.</div>
        </div>
    );
};

export default MatchesPage;
