const express = require('express');
const prisma = require('../prisma');
const router = express.Router();
const { syncMatches } = require('../jobs/matchSyncJob');

// 홈 화면용: 예정 경기 우선, 없으면 최근 완료
router.get('/', async (req, res) => {
    try {
        let matches = await prisma.match.findMany({
            where: { status: { in: ['TIMED', 'SCHEDULED'] } },
            orderBy: { utcDate: 'asc' },
            take: 7
        });

        if (matches.length === 0) {
            matches = await prisma.match.findMany({
                where: { status: 'FINISHED' },
                orderBy: { utcDate: 'desc' },
                take: 7
            });
        }

        res.json({ matches: serialize(matches) });
    } catch (err) {
        console.error('❌ 경기 조회 실패:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 전체 경기 목록 (페이지네이션)
// GET /api/matches/all?tab=upcoming|past&page=1&limit=10
router.get('/all', async (req, res) => {
    const tab   = req.query.tab === 'past' ? 'past' : 'upcoming';
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    try {
        const where = tab === 'upcoming'
            ? { status: { in: ['TIMED', 'SCHEDULED'] } }
            : { status: 'FINISHED' };

        const orderBy = tab === 'upcoming'
            ? { utcDate: 'asc' }
            : { utcDate: 'desc' };

        const [matches, total] = await Promise.all([
            prisma.match.findMany({ where, orderBy, take: limit, skip }),
            prisma.match.count({ where }),
        ]);

        res.json({
            matches: serialize(matches),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error('❌ 전체 경기 조회 실패:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 시즌 타임라인: 전체 경기 날짜순
// GET /api/matches/season
router.get('/season', async (req, res) => {
    try {
        const matches = await prisma.match.findMany({
            orderBy: { utcDate: 'asc' },
            take: 60,
        });
        res.json({ matches: serialize(matches) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 시즌 전체 수동 동기화 (최초 데이터 로딩용)
router.post('/sync-full', async (req, res) => {
    try {
        await syncMatches(true);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function serialize(matches) {
    return matches.map(m => ({
        ...m,
        id:         m.id.toString(),
        homeTeamId: m.homeTeamId ?? null,
        awayTeamId: m.awayTeamId ?? null,
        homeScore:  m.homeScore ?? null,
        awayScore:  m.awayScore ?? null,
    }));
}

module.exports = router;
