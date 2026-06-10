const axios = require('axios');
const cron = require('node-cron');
const { upsertTeamStanding } = require('../service/standingService');

function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 8 ? year : year - 1;
}

const syncStandings = async (season) => {
    const targetSeason = season ?? getCurrentSeason();
    try {
        const res = await axios.get(
            'https://api.football-data.org/v4/competitions/2021/standings',
            {
                headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY },
                params: { season: targetSeason }
            }
        );

        const table = res.data.standings?.[0]?.table ?? [];

        for (const team of table) {
            await upsertTeamStanding({
                teamId:       team.team.id,
                season:       targetSeason,
                name:         team.team.name,
                crest:        team.team.crest,
                position:     team.position,
                played:       team.playedGames,
                won:          team.won,
                draw:         team.draw,
                lost:         team.lost,
                goalsFor:     team.goalsFor,
                goalsAgainst: team.goalsAgainst,
                goalDiff:     team.goalDifference,
                points:       team.points,
                form:         team.form ?? null,
            });
        }

        console.log(`✅ 순위 ${table.length}건 upsert 완료 (season=${targetSeason})`);
    } catch (err) {
        console.error('❌ 순위 동기화 실패:', err.response?.status, JSON.stringify(err.response?.data) || err.message);
    }
};

cron.schedule('0 */6 * * *', () => syncStandings());
syncStandings();

module.exports = syncStandings;
