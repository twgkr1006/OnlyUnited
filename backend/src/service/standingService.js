const prisma = require('../prisma');

async function upsertTeamStanding(team) {
    const {
        teamId, season, name, crest,
        position, played, won, draw, lost,
        goalsFor, goalsAgainst, goalDiff, points, form
    } = team;

    return await prisma.teamStanding.upsert({
        where: { teamId_season: { teamId, season } },
        update: { name, crest, position, played, won, draw, lost, goalsFor, goalsAgainst, goalDiff, points, form },
        create: { teamId, season, name, crest, position, played, won, draw, lost, goalsFor, goalsAgainst, goalDiff, points, form }
    });
}

module.exports = { upsertTeamStanding };
