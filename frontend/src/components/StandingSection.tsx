import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import teamNameKoMap from '../constants/TeamNameKoMap';

const MANCHESTER_UNITED_ID = 66;

const StandingSection = () => {
    const navigate = useNavigate();
    const [table, setTable] = useState<any[]>([]);

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                const res = await axios.get('/api/standings');
                const fullTable = Array.isArray(res.data)
                    ? res.data
                    : (res.data.standings || res.data.data || []);
                const manuIndex = fullTable.findIndex((team: any) => team.teamId === MANCHESTER_UNITED_ID);
                const customTable = fullTable.slice(Math.max(0, manuIndex - 2), manuIndex + 3);
                setTable(customTable);
            } catch (err) {
                console.error('?? ?? ???? ??:', err);
            }
        };
        fetchStandings();
    }, []);

    return (
        <div className="bg-[#545454] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg text-white">{'\ud504\ub9ac\ubbf8\uc5b4\ub9ac\uadf8 \uc21c\uc704'}</h2>
                <button onClick={() => navigate('/standings')} className="text-gray-400 hover:text-white text-xl">
                    {'\u2192'}
                </button>
            </div>
            <div className="space-y-2">
                {table.map((team: any) => (
                    <div
                        key={team.teamId}
                        className={`flex items-center justify-between bg-[#2e2d2d] p-3 rounded-lg ${
                            team.teamId === MANCHESTER_UNITED_ID ? 'border border-red-600' : ''
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400 w-4">{team.position}</span>
                            <img src={team.crest} alt={team.name} className="w-6 h-6" />
                            <span className="text-white">
                                {teamNameKoMap[team.teamId] || team.name}
                            </span>
                        </div>
                        <span className="text-white">{team.points}</span>
                    </div>
                ))}
            </div>
            <button
                onClick={() => navigate('/standings')}
                className="w-full mt-4 py-2 text-gray-400 hover:text-white bg-[#2e2d2d] rounded-lg text-sm transition-colors"
            >
                {'\uc804\uccb4 \uc21c\uc704 \ubcf4\uae30 \u2192'}
            </button>
        </div>
    );
};

export default StandingSection;
