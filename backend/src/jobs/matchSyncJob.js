const axios = require('axios');
const cron = require('node-cron');
const { upsertMatch } = require('../service/matchService');

const MAN_UTD_TEAM_ID = 66;
const COMPETITIONS = ['PL', 'CL', 'EL', 'FAC', 'ELC'];
const API_HEADERS = () => ({ 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY });

function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1;
    return month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

async function fetchCompetitionMatches(competition, season) {
    try {
        const { data } = await axios.get(
            `https://api.football-data.org/v4/competitions/${competition}/matches`,
            { headers: API_HEADERS(), params: { season }, timeout: 15000 }
        );
        const all = data.matches ?? [];
        return all.filter(m => m.homeTeam?.id === MAN_UTD_TEAM_ID || m.awayTeam?.id === MAN_UTD_TEAM_ID);
    } catch (e) {
        if (e?.response?.status !== 403) {
            console.warn(`[MATCH SYNC] ${competition} 실패:`, e?.response?.status, e.message);
        }
        return [];
    }
}

const syncMatches = async () => {
    try {
        const season = getCurrentSeason();

        const results = await Promise.allSettled(
            COMPETITIONS.map(c => fetchCompetitionMatches(c, season))
        );
        let matches = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

        // 중복 제거
        const seen = new Set();
        matches = matches.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });

        if (matches.length === 0) {
            console.warn(`[MATCH SYNC] season=${season} 경기 없음`);
            return;
        }

        for (const m of matches) {
            await upsertMatch({
                id:          m.id,
                matchday:    m.matchday,
                utcDate:     m.utcDate,
                homeTeam:    m.homeTeam.name,
                homeTeamId:  m.homeTeam.id,
                awayTeam:    m.awayTeam.name,
                awayTeamId:  m.awayTeam.id,
                status:      m.status,
                competition: m.competition.name,
                homeScore:   m.score?.fullTime?.home ?? null,
                awayScore:   m.score?.fullTime?.away ?? null,
            });
        }

        console.log(`✅ 경기 ${matches.length}건 동기화 완료 (season=${season})`);
    } catch (err) {
        console.error('❌ 경기 동기화 실패:', err?.response?.status, err.message);
    }
};

// 6시간마다 정기 동기화
cron.schedule('0 */6 * * *', syncMatches);

// 서버 시작 시 실행
syncMatches();

module.exports = { syncMatches };
