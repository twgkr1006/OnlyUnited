import { useEffect, useState } from 'react';
import axios from 'axios';
import teamNameKoMap from '../constants/TeamNameKoMap';

const MANCHESTER_UNITED_ID = 66;

const StandingSection = () => {
    const [table, setTable] = useState<any[]>([]);

    useEffect(() => {
        const fetchStandings = async () => {
        try {
            const res = await axios.get('/football-api/v4/competitions/2021/standings', {
                headers: {
                    'X-Auth-Token': import.meta.env.VITE_FOOTBALL_DATA_KEY
                }
            });

            const fullTable = res.data.standings[0]?.table || [];
            const manuIndex = fullTable.findIndex((team: any) => team.team.id === MANCHESTER_UNITED_ID);
    
            // 맨유 위 2팀 + 본인 + 아래 2팀 → 총 5팀만 추출
            const customTable = fullTable.slice(Math.max(0, manuIndex - 2), manuIndex + 3);
            setTable(customTable);
        } catch (err) {
            console.error("❌ 순위 정보 불러오기 실패:", err);
        }
        };

        fetchStandings();
    }, []);

    return (
        <div className="bg-[#545454] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg text-white">프리미어리그 순위</h2>
                <button className="text-gray-400 hover:text-white text-xl">›</button>
            </div>
            <div className="space-y-2">
                {table.map((team: any) => (
                <div
                    key={team.team.id}
                    className={`flex items-center justify-between bg-[#2e2d2d] p-3 rounded-lg ${
                    team.team.id === MANCHESTER_UNITED_ID ? 'border border-red-600' : ''
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400 w-4">{team.position}</span>
                        <img src={team.team.crest} alt={team.team.name} className="w-6 h-6" />
                        <span className="text-white">
                            {teamNameKoMap[team.team.id] || team.team.name}
                        </span>
                    </div>
                    <span className="text-white">{team.points}</span>
                </div>
                ))}
            </div>
            <button className="w-full mt-4 py-2 text-gray-400 hover:text-white bg-[#2e2d2d] rounded-lg text-sm">
                전체 순위 보기 →
            </button>
        </div>
    );
};

export default StandingSection;