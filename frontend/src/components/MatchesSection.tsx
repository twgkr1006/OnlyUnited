import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import teamNameKoMap from '../constants/TeamNameKoMap';

const MAN_UTD_ID = 66;

const VENUE_MAP: Record<number, string> = {
  57:  'Emirates Stadium',       // Arsenal
  58:  'Villa Park',             // Aston Villa
  61:  'Stamford Bridge',        // Chelsea
  62:  'Selhurst Palace',        // Crystal Palace
  63:  'Goodison Park',          // Everton
  64:  'Anfield',                // Liverpool
  65:  'Etihad Stadium',         // Man City
  66:  'Old Trafford',           // Man United
  67:  "St. James' Park",        // Newcastle
  73:  'Tottenham Hotspur Stadium',
  328: 'Falmer Stadium',         // Brighton
  340: 'Molineux Stadium',       // Wolves
  354: 'Bramall Lane',           // Sheffield Utd
  356: 'The Hawthorns',          // West Brom
  397: 'Amex Stadium',           // Brighton (alt)
  402: 'Portman Road',           // Ipswich
  537: 'Brentford Community Stadium',
  563: 'London Stadium',         // West Ham
  610: 'Elland Road',            // Leeds
  715: 'Dean Court',             // Bournemouth
  741: 'Nottingham Forest',      // NFFC
  770: 'Fulham FC',              // Fulham
  1044:'Luton Town',             // Luton
  76:  'King Power Stadium',     // Leicester
  346: 'Burnley FC',
};

const getVenue = (homeTeamId: number) => VENUE_MAP[homeTeamId] ?? null;

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
}

const getTeamInfo = (id: number, name: string) => ({
  name: teamNameKoMap[id] || name,
  crest: `https://crests.football-data.org/${id}.png`,
});

const formatDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
};

const getResult = (m: Match): '승' | '패' | '무' | null => {
  if (m.homeScore == null || m.awayScore == null) return null;
  const isHome = m.homeTeamId === MAN_UTD_ID;
  const my = isHome ? m.homeScore : m.awayScore;
  const op = isHome ? m.awayScore : m.homeScore;
  return my > op ? '승' : my < op ? '패' : '무';
};

const resultColor = (r: string | null) =>
  r === '승' ? 'text-green-400' : r === '패' ? 'text-red-400' : r === '무' ? 'text-yellow-400' : '';

const MatchesSection = () => {
  const navigate = useNavigate();
  const [highlight, setHighlight] = useState<Match | null>(null);
  const [others, setOthers] = useState<Match[]>([]);

  useEffect(() => {
    axios.get('/api/matches')
      .then(res => {
        const list: Match[] = res.data.matches ?? [];
        if (list.length > 0) {
          setHighlight(list[0]);
          setOthers(list.slice(1, 7));
        }
      })
      .catch(console.error);
  }, []);

  if (!highlight) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-lg">경기 일정을 불러오는 중입니다.</p>
      <p className="text-sm mt-2">잠시 후 다시 시도해주세요.</p>
    </div>
  );

  const isUpcoming = highlight.status === 'TIMED' || highlight.status === 'SCHEDULED';
  const homeInfo = getTeamInfo(highlight.homeTeamId, highlight.homeTeam);
  const awayInfo = getTeamInfo(highlight.awayTeamId, highlight.awayTeam);
  const mainResult = getResult(highlight);

  return (
    <div className="text-white space-y-4">
      {/* 하이라이트 경기 */}
      <div
        className="bg-[#2e2d2d] rounded-lg shadow text-center pt-8 pb-6 cursor-pointer hover:bg-[#3a3939] transition-colors"
        onClick={() => navigate(`/matches/${highlight.id}`)}
      >
        <h2 className="text-2xl font-bold mb-4">{isUpcoming ? '다음 경기' : '최근 경기'}</h2>
        <div className="text-gray-400 text-sm mb-4">{formatDate(highlight.utcDate)}</div>
        <div className="flex justify-between items-center px-6">
          {/* 홈팀 */}
          <div className="flex items-center gap-4 flex-1">
            <img src={homeInfo.crest} className="w-20 h-20 object-contain" onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
            <span className="text-xl font-bold">{homeInfo.name}</span>
          </div>
          {/* 스코어 or VS */}
          <div className="text-center px-4">
            {(() => {
              const venue = getVenue(highlight.homeTeamId);
              return venue ? (
                <div className="text-[11px] text-gray-500 mb-1 tracking-wide">{venue}</div>
              ) : null;
            })()}
            {isUpcoming ? (
              <span className="text-6xl font-extrabold tracking-wider text-gray-200">VS</span>
            ) : (
              <div>
                <span className="text-6xl font-extrabold tracking-wider">
                  {highlight.homeScore} : {highlight.awayScore}
                </span>
                {mainResult && (
                  <div className={`text-xl font-bold mt-1 ${resultColor(mainResult)}`}>{mainResult}</div>
                )}
              </div>
            )}
          </div>
          {/* 원정팀 */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <span className="text-xl font-bold">{awayInfo.name}</span>
            <img src={awayInfo.crest} className="w-20 h-20 object-contain" onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-3">{highlight.competition}</div>
      </div>

      {/* 나머지 최대 6경기 — 2열 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {others.map(m => {
          const hi = getTeamInfo(m.homeTeamId, m.homeTeam);
          const ai = getTeamInfo(m.awayTeamId, m.awayTeam);
          const r = getResult(m);
          const scheduled = m.status === 'TIMED' || m.status === 'SCHEDULED';
          const venue = getVenue(m.homeTeamId);
          return (
            <div
              key={m.id}
              className="bg-[#2e2d2d] rounded-lg py-4 px-3 cursor-pointer hover:bg-[#3a3939] transition-colors"
              onClick={() => navigate(`/matches/${m.id}`)}
            >
              <div className="text-center text-gray-400 text-xs mb-1">{formatDate(m.utcDate)}</div>
              {venue && (
                <div className="text-center text-[10px] text-gray-600 mb-2 truncate">{venue}</div>
              )}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-xs text-right line-clamp-1">{hi.name}</span>
                  <img src={hi.crest} className="w-8 h-8 object-contain flex-shrink-0" onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
                </div>
                <div className="text-center px-2 min-w-[52px]">
                  {scheduled ? (
                    <span className="text-sm font-bold text-gray-300">VS</span>
                  ) : (
                    <span className={`text-sm font-bold ${resultColor(r)}`}>
                      {m.homeScore} : {m.awayScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <img src={ai.crest} className="w-8 h-8 object-contain flex-shrink-0" onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
                  <span className="text-xs line-clamp-1">{ai.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 전체 경기 보기 버튼 */}
      <button
        onClick={() => navigate('/matches')}
        className="w-full py-2.5 bg-[#2e2d2d] hover:bg-[#3a3939] text-gray-300 hover:text-white rounded-lg text-sm transition-colors border border-[#444]"
      >
        전체 경기 보기 →
      </button>
    </div>
  );
};

export default MatchesSection;
