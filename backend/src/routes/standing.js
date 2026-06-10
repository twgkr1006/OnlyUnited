const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    return (now.getMonth() + 1) >= 8 ? year : year - 1;
}

// GET /api/standings?season=2025
router.get('/', async (req, res) => {
    const season = parseInt(req.query.season) || getCurrentSeason();

    const standings = await prisma.teamStanding.findMany({
        where: { season },
        orderBy: { position: 'asc' }
    });
    res.json(standings);
});

// GET /api/standings/seasons - 저장된 시즌 목록
router.get('/seasons', async (req, res) => {
    const seasons = await prisma.teamStanding.findMany({
        distinct: ['season'],
        select: { season: true },
        orderBy: { season: 'desc' }
    });
    res.json(seasons.map(s => s.season));
});

module.exports = router;
