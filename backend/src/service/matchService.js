const prisma = require('../prisma');

async function upsertMatch(match) {
    const {
        id, matchday, utcDate,
        homeTeam, homeTeamId,
        awayTeam, awayTeamId,
        status, competition,
        homeScore, awayScore
    } = match;

    return await prisma.match.upsert({
        where: { id: BigInt(id) },
        update: {
            matchday,
            utcDate: new Date(utcDate),
            homeTeam, awayTeam, homeTeamId, awayTeamId,
            status, competition,
            homeScore: homeScore ?? null,
            awayScore: awayScore ?? null,
        },
        create: {
            id: BigInt(id),
            utcDate: new Date(utcDate),
            homeTeam, awayTeam, homeTeamId, awayTeamId,
            status, competition,
            homeScore: homeScore ?? null,
            awayScore: awayScore ?? null,
        }
    });
}

module.exports = { upsertMatch };
