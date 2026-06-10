const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// GET /api/news?limit=20&offset=0
router.get('/', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = parseInt(req.query.offset) || 0;

    try {
        const news = await prisma.news.findMany({
            orderBy: { publishedAt: 'desc' },
            take: limit,
            skip: offset,
        });

        res.json({ news });
    } catch (err) {
        console.error('❌ 뉴스 불러오기 실패:', err);
        res.status(500).json({ error: '뉴스 로딩 오류' });
    }
});

module.exports = router;
