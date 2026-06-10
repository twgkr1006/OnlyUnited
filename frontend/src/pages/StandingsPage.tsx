import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import teamNameKoMap from '../constants/TeamNameKoMap';

const MAN_UTD_ID = 66;

interface Standing {
    teamId: number;
    season: number;
    name: string;
    crest: string;
    position: number;
    played: number;
    won: number;
    draw: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    form: string | null;
}

const FormDot = ({ result }: { result: string }) => {
    const bgMap: Record<string, string> = {
        W: 'bg-green-500',
        D: 'bg-gray-400',
        L: 'bg-red-500',
    };
    const labelMap: Record<string, string> = {
        W: '\uC2B9',
        D: '\uBB34',
        L: '\uD328',
    };
    return (
        <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold ${bgMap[result] ?? 'bg-gray-600'}`}
        >
            {labelMap[result] ?? '-'}
        </span>
    );
};

const StandingsPage = () => {
    const navigate = useNavigate();
    const [standings, setStandings] = useState<Standing[]>([]);
    const [seasons, setSeasons] = useState<number[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(2025);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/standings/seasons')
            .then(res => {
                const list: number[] = res.data;
                setSeasons(list);
                if (list.length > 0) setSelectedSeason(list[0]);
            })
            .catch(() => setSeasons([2025]));
    }, []);

    useEffect(() => {
        setLoading(true);
        axios.get(`/api/standings?season=${selectedSeason}`)
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setStandings(data);
            })
            .catch(() => setStandings([]))
            .finally(() => setLoading(false));
    }, [selectedSeason]);

    const formatSeason = (s: number) => `${s}~${String(s + 1).slice(2)}`;

    const renderSkeleton = () => (
        <div className="space-y-1">
            {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#2e2d2d] rounded animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen">
            <div className="pt-6 pb-4 flex justify-center">
                <Logo size="large" />
            </div>

            <div className="container mx-auto px-4 pb-10">
                {/* ?? */}
                <div className="bg-[#545454] rounded-lg p-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
                        >
                            {'\u2190 \uD648\uC73C\ub85C'}
                        </button>
                        <span className="text-gray-600">|</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-red-600 rounded" />
                            <h1 className="text-xl font-bold text-white">{'\uD504\ub9AC\ubbf8\uc5b4 \ub9ac\uadf8 \uc21c\uc704'}</h1>
                        </div>
                    </div>

                    {/* ?? ?? */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">{'\uc2dc\uc98c'}</span>
                        <select
                            value={selectedSeason}
                            onChange={e => setSelectedSeason(Number(e.target.value))}
                            className="bg-[#2e2d2d] text-white text-sm rounded px-3 py-1.5 border border-[#3e3d3d] focus:outline-none cursor-pointer"
                        >
                            {seasons.map(s => (
                                <option key={s} value={s}>{formatSeason(s)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ??? */}
                <div className="bg-[#545454] rounded-lg overflow-hidden">
                    {/* ?? ? */}
                    <div className="grid text-gray-400 text-xs px-4 py-2 border-b border-[#3e3d3d]"
                        style={{ gridTemplateColumns: '2rem 2rem 1fr 3rem 3rem 3rem 3rem 3rem 3rem 3rem 3rem 8rem' }}>
                        <span></span>
                        <span></span>
                        <span>{'\ud300\uba85'}</span>
                        <span className="text-center">{'\uacbd\uae30'}</span>
                        <span className="text-center">{'\uc2b9'}</span>
                        <span className="text-center">{'\ubb34'}</span>
                        <span className="text-center">{'\ud328'}</span>
                        <span className="text-center">{'\ub4dd\uc810'}</span>
                        <span className="text-center">{'\uc2e4\uc810'}</span>
                        <span className="text-center">{'\ub4dd\uc2e4'}</span>
                        <span className="text-center font-bold text-white">{'\uc2b9\uc810'}</span>
                        <span className="text-center">{'\ucd5c\uadfc 5\uacbd\uae30'}</span>
                    </div>

                    {loading ? renderSkeleton() : (
                        standings.map((team, idx) => {
                            const isManUtd = team.teamId === MAN_UTD_ID;
                            const formList = team.form
                                ? team.form.split(',').slice(0, 5)
                                : [];

                            return (
                                <div
                                    key={team.teamId}
                                    className={`grid items-center px-4 py-2 text-sm transition-colors hover:bg-[#3a3939]
                                        ${isManUtd ? 'border-l-4 border-red-600 bg-[#3a2020]' : idx % 2 === 0 ? 'bg-[#2e2d2d]' : 'bg-[#333232]'}
                                    `}
                                    style={{ gridTemplateColumns: '2rem 2rem 1fr 3rem 3rem 3rem 3rem 3rem 3rem 3rem 3rem 8rem' }}
                                >
                                    {/* ?? */}
                                    <span className={`font-bold text-center ${
                                        team.position <= 4 ? 'text-blue-400' :
                                        team.position === 5 ? 'text-orange-400' :
                                        team.position >= 18 ? 'text-red-400' : 'text-gray-300'
                                    }`}>
                                        {team.position}
                                    </span>

                                    {/* ???? */}
                                    <img
                                        src={team.crest}
                                        alt={team.name}
                                        className="w-6 h-6 object-contain"
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                    />

                                    {/* ?? */}
                                    <span className={`font-medium ${isManUtd ? 'text-red-300' : 'text-white'}`}>
                                        {teamNameKoMap[team.teamId] || team.name}
                                    </span>

                                    <span className="text-center text-gray-300">{team.played}</span>
                                    <span className="text-center text-gray-300">{team.won}</span>
                                    <span className="text-center text-gray-300">{team.draw}</span>
                                    <span className="text-center text-gray-300">{team.lost}</span>
                                    <span className="text-center text-gray-300">{team.goalsFor}</span>
                                    <span className="text-center text-gray-300">{team.goalsAgainst}</span>
                                    <span className={`text-center font-medium ${
                                        team.goalDiff > 0 ? 'text-green-400' :
                                        team.goalDiff < 0 ? 'text-red-400' : 'text-gray-300'
                                    }`}>
                                        {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                                    </span>
                                    <span className="text-center font-bold text-white">{team.points}</span>

                                    {/* ? */}
                                    <div className="flex justify-center gap-1">
                                        {formList.length > 0
                                            ? formList.map((r, i) => <FormDot key={i} result={r} />)
                                            : <span className="text-gray-600 text-xs">-</span>
                                        }
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* ?? */}
                    {!loading && (
                        <div className="px-4 py-3 border-t border-[#3e3d3d] flex gap-6 text-xs text-gray-400">
                            <span><span className="text-blue-400 font-bold">?</span> UCL {'\uc9c4\ucd9c'}</span>
                            <span><span className="text-orange-400 font-bold">?</span> UEL {'\uc9c4\ucd9c'}</span>
                            <span><span className="text-red-400 font-bold">?</span> {'\uac15\ub4f1\uad8c'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center text-gray-500 text-sm pb-6">
                {'\u00a9'} OnlyUnited All Rights Reserved.
            </div>
        </div>
    );
};

export default StandingsPage;
