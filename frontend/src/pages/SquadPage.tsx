import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';

// 선수 API-Football ID → 상세 페이지 라우트 param
// SquadPage PlayerCard에서 사용

interface Player {
    id: number;
    playerId: number;
    name: string;
    age: number;
    number: number;
    shirtNumber?: number;
    position: string;
    photo: string;
    nationality?: string;
    appearances?: number;
    goals?: number;
    assists?: number;
    rating?: string;
}

const positionKoMap: Record<string, string> = {
    Goalkeeper: '골키퍼',
    Defender: '수비수',
    Midfielder: '미드필더',
    Attacker: '공격수',
    Forward: '공격수',
};

const positionShortMap: Record<string, string> = {
    Goalkeeper: 'GK',
    Defender: 'DF',
    Midfielder: 'MF',
    Attacker: 'FW',
    Forward: 'FW',
};

const positionColorMap: Record<string, string> = {
    Goalkeeper: 'bg-yellow-600 text-yellow-100',
    Defender: 'bg-blue-700 text-blue-100',
    Midfielder: 'bg-green-700 text-green-100',
    Attacker: 'bg-red-700 text-red-100',
    Forward: 'bg-red-700 text-red-100',
};

const positionOrder: Record<string, number> = {
    Goalkeeper: 1,
    Defender: 2,
    Midfielder: 3,
    Attacker: 4,
    Forward: 4,
};

const filterTabs = [
    { key: 'ALL', label: '전체' },
    { key: 'GK', label: 'GK' },
    { key: 'DF', label: 'DF' },
    { key: 'MF', label: 'MF' },
    { key: 'FW', label: 'FW' },
];

// ─── PlayerCard ────────────────────────────────────────────────────────────
const PlayerCard = ({ player }: { player: Player }) => {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const positionKo = positionKoMap[player.position] || player.position;
    const positionColor = positionColorMap[player.position] || 'bg-gray-600 text-gray-100';
    const positionShort = positionShortMap[player.position] || player.position;

    const hasStats =
        player.appearances != null || player.goals != null || player.assists != null;

    return (
        <div
            className="bg-[#2e2d2d] rounded-lg overflow-hidden hover:bg-[#3a3939] transition-colors cursor-pointer"
            onClick={() => navigate(`/squad/${player.playerId}`)}
        >
            {/* 사진 영역 */}
            <div className="relative bg-[#1a1a1a] flex justify-center items-end" style={{ height: '160px' }}>
                {/* 등번호 */}
                {(player.shirtNumber ?? player.number) != null && (
                    <div className="absolute top-2 left-3 bg-red-700 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center z-10">
                        {player.shirtNumber ?? player.number}
                    </div>
                )}
                {/* 포지션 */}
                <div className={`absolute top-2 right-3 text-xs font-bold px-2 py-0.5 rounded z-10 ${positionColor}`}>
                    {positionShort}
                </div>
                {/* 선수 사진 */}
                {!imgError && player.photo ? (
                    <img
                        src={player.photo}
                        alt={player.name}
                        className="h-full w-full object-contain object-bottom"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-[#3e3d3d] flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* 선수 정보 */}
            <div className="p-3">
                <h3 className="text-white font-semibold text-sm text-center mb-1 truncate">{player.name}</h3>
                <p className="text-gray-400 text-xs text-center mb-2">{positionKo}</p>

                <div className="flex justify-center gap-3 text-xs text-gray-500">
                    {player.age != null && <span>만 {player.age}세</span>}
                    {player.nationality && <span>{player.nationality}</span>}
                </div>

                {/* 시즌 스탯 */}
                {hasStats && (
                    <div className="mt-3 pt-3 border-t border-[#3e3d3d] grid grid-cols-3 gap-1 text-center">
                        <div>
                            <p className="text-white font-bold text-sm">{player.appearances ?? '-'}</p>
                            <p className="text-gray-500 text-xs">출전</p>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">{player.goals ?? '-'}</p>
                            <p className="text-gray-500 text-xs">골</p>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">{player.assists ?? '-'}</p>
                            <p className="text-gray-500 text-xs">어시스트</p>
                        </div>
                    </div>
                )}

                {/* 평점 */}
                {player.rating && (
                    <div className="mt-2 text-center">
                        <span className="bg-red-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                            ★ {parseFloat(player.rating).toFixed(1)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── SquadPage ──────────────────────────────────────────────────────────────
const SquadPage = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');

    useEffect(() => {
        const fetchSquad = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/api/squad');
                console.log('선수단 데이터:', res.data);

                const squad =
                    res.data.squad ||
                    res.data.players ||
                    res.data.response?.[0]?.players ||
                    (Array.isArray(res.data) ? res.data : []);

                setPlayers(squad);
            } catch (err) {
                console.error('❌ 선수단 데이터 불러오기 실패:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchSquad();
    }, []);

    const filteredPlayers = players.filter((p) => {
        if (activeTab === 'ALL') return true;
        return positionShortMap[p.position] === activeTab;
    });

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        const orderA = positionOrder[a.position] ?? 5;
        const orderB = positionOrder[b.position] ?? 5;
        if (orderA !== orderB) return orderA - orderB;
        return (a.number ?? 99) - (b.number ?? 99);
    });

    const renderSkeleton = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-[#2e2d2d] rounded-lg overflow-hidden animate-pulse">
                    <div className="bg-[#1a1a1a]" style={{ height: '160px' }} />
                    <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-600 rounded mx-4" />
                        <div className="h-3 bg-gray-600 rounded w-1/2 mx-auto" />
                        <div className="h-3 bg-gray-600 rounded w-1/3 mx-auto" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen">
            {/* 로고 */}
            <div className="pt-6 pb-4 flex justify-center">
                <Logo size="large" />
            </div>

            <div className="container mx-auto px-4 pb-8">
                {/* 헤더 */}
                <div className="bg-[#545454] rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                            >
                                ← 홈으로
                            </button>
                            <span className="text-gray-600">|</span>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-red-600 rounded" />
                                <h1 className="text-xl font-bold text-white">맨체스터 유나이티드 선수단</h1>
                            </div>
                        </div>
                        <span className="text-gray-400 text-sm">2024/25 시즌</span>
                    </div>
                </div>

                {/* 포지션 필터 탭 */}
                <div className="bg-[#545454] rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    activeTab === tab.key
                                        ? 'bg-red-700 text-white'
                                        : 'bg-[#2e2d2d] text-gray-400 hover:text-white hover:bg-[#3e3d3d]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                        <div className="ml-auto flex items-center gap-3">
                            <button
                                onClick={() => navigate('/compare')}
                                className="flex items-center gap-1.5 bg-[#2e2d2d] hover:bg-[#3e3d3d] text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                            >
                                ⚖️ 선수 비교
                            </button>
                            <span className="text-gray-400 text-sm">
                                {loading ? '...' : `${sortedPlayers.length}명`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 선수 그리드 */}
                <div className="bg-[#545454] rounded-lg p-4">
                    {loading ? (
                        renderSkeleton()
                    ) : error ? (
                        <div className="text-center py-16 text-gray-400 space-y-2">
                            <p className="text-lg">선수단 정보를 불러올 수 없습니다.</p>
                            <p className="text-sm">잠시 후 다시 시도해주세요.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-6 py-2 bg-[#2e2d2d] text-gray-300 rounded-lg hover:bg-[#3e3d3d] transition-colors text-sm"
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : sortedPlayers.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <p>해당 포지션의 선수가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sortedPlayers.map((player) => (
                                <PlayerCard key={player.id} player={player} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 카피라이트 */}
            <div className="text-center text-gray-500 text-sm pb-4">
                © OnlyUnited All Rights Reserved.
            </div>
        </div>
    );
};

export default SquadPage;
