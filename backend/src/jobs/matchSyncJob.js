const axios = require('axios');
const cron = require('node-cron');
const { upsertMatch } = require('../service/matchService');

const MAN_UTD_TEAM_ID = 66;
const API_HEADERS = () => ({ 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY });

function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1;
    return month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

async function fetchMatches(status, season, limit = 50) {
    const { data } = await axios.get(
        `https://api.football-data.org/v4/teams/${MAN_UTD_TEAM_ID}/matches`,
        {
            headers: API_HEADERS(),
            params: { season, status, limit },
            timeout: 10000,
        }
    );
    return data.matches ?? [];
}

const syncMatches = async (fullSync = false) => {
    try {
        const season = getCurrentSeason();

        let matches = [];

        if (fullSync) {
            // 시즌 전체 경기 가져오기 (최초 1회 또는 수동)
            const [fin, tim] = await Promise.allSettled([
                fetchMatches('FINISHED', season, 50),
                fetchMatches('TIMED',    season, 50),
            ]);
            matches = [
                ...(fin.status === 'fulfilled' ? fin.value : []),
                ...(tim.status === 'fulfilled' ? tim.value : []),
            ];
        } else {
            // 정기 동기화: 최근 완료 5 + 예정 10
            const [fin, tim] = await Promise.allSettled([
                fetchMatches('FINISHED', season, 5),
                fetchMatches('TIMED',    season, 10),
            ]);
            matches = [
                ...(fin.status === 'fulfilled' ? fin.value : []),
                ...(tim.status === 'fulfilled' ? tim.value : []),
            ];
        }

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
cron.schedule('0 */6 * * *', () => syncMatches(false));

// 서버 시작 시 실행
syncMatches(false);

module.exports = { syncMatches };
