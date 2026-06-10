const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

const CATEGORIES = ['FREE', 'MATCH', 'PLAYER', 'TRANSFER', 'HUMOR', 'VOTE'];
const PAGE_SIZE = 20;

// ── 목록 ────────────────────────────────────────────────────────────────────
// GET /api/board?category=FREE&page=1&q=검색어
router.get('/', async (req, res) => {
    const { category, page = 1, q } = req.query;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;

    const where = {
        ...(category && category !== 'ALL' ? { category } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { content: { contains: q } }] } : {}),
    };

    try {
        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: PAGE_SIZE,
                select: {
                    id: true, title: true, nickname: true, category: true,
                    views: true, likes: true, isPinned: true, hasPoll: true, createdAt: true,
                    _count: { select: { comments: true } },
                },
            }),
            prisma.post.count({ where }),
        ]);
        res.json({ posts, total, page: parseInt(page), pageSize: PAGE_SIZE });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── 상세 ─────────────────────────────────────────────────────────────────────
// GET /api/board/:id?clientId=xxx
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { clientId } = req.query;
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    try {
        // 조회수 +1
        const post = await prisma.post.update({
            where: { id },
            data: { views: { increment: 1 } },
            include: {
                comments: { orderBy: { createdAt: 'asc' } },
                _count: { select: { comments: true } },
                poll: {
                    include: {
                        options: { orderBy: { id: 'asc' } },
                        votes: clientId ? { where: { clientId } } : false,
                    },
                },
            },
        });
        // 내가 투표한 optionId 첨부
        let myVoteOptionId = null;
        if (post.poll && clientId) {
            const myVote = post.poll.votes?.[0];
            myVoteOptionId = myVote?.optionId ?? null;
        }
        const result = {
            ...post,
            poll: post.poll ? {
                ...post.poll,
                votes: undefined,
                myVoteOptionId,
            } : null,
        };
        res.json(result);
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
        res.status(500).json({ error: err.message });
    }
});

// ── 작성 ─────────────────────────────────────────────────────────────────────
// POST /api/board
// body: { title, content, nickname, category, pollQuestion?, pollOptions?: string[] }
router.post('/', async (req, res) => {
    const { title, content, nickname, category = 'FREE', pollQuestion, pollOptions } = req.body;
    if (!title?.trim() || !content?.trim() || !nickname?.trim()) {
        return res.status(400).json({ error: '제목, 내용, 닉네임은 필수입니다.' });
    }
    if (title.length > 200) return res.status(400).json({ error: '제목이 너무 깁니다.' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: '잘못된 카테고리' });

    const hasPoll = !!(pollQuestion?.trim() && Array.isArray(pollOptions) && pollOptions.length >= 2);

    try {
        const post = await prisma.post.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                nickname: nickname.trim(),
                category,
                hasPoll,
                ...(hasPoll ? {
                    poll: {
                        create: {
                            question: pollQuestion.trim(),
                            options: {
                                create: pollOptions
                                    .map(o => o?.trim())
                                    .filter(o => o)
                                    .map(text => ({ text })),
                            },
                        },
                    },
                } : {}),
            },
            include: { poll: { include: { options: true } } },
        });
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── 수정 ─────────────────────────────────────────────────────────────────────
// PUT /api/board/:id
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, content, nickname } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    try {
        const existing = await prisma.post.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (existing.nickname !== nickname) return res.status(403).json({ error: '작성자만 수정 가능합니다.' });
        const post = await prisma.post.update({
            where: { id },
            data: { title: title?.trim(), content: content?.trim() },
        });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── 삭제 ─────────────────────────────────────────────────────────────────────
// DELETE /api/board/:id
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { nickname } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    try {
        const existing = await prisma.post.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (existing.nickname !== nickname) return res.status(403).json({ error: '작성자만 삭제 가능합니다.' });
        await prisma.post.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── 좋아요 ────────────────────────────────────────────────────────────────────
// POST /api/board/:id/like   body: { clientId }
router.post('/:id/like', async (req, res) => {
    const id = parseInt(req.params.id);
    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId 필요' });
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    try {
        // 중복 좋아요 방지
        const existing = await prisma.postLike.findUnique({
            where: { postId_clientId: { postId: id, clientId } },
        });
        if (existing) {
            // 좋아요 취소
            await prisma.postLike.delete({ where: { id: existing.id } });
            const post = await prisma.post.update({ where: { id }, data: { likes: { decrement: 1 } } });
            return res.json({ liked: false, likes: post.likes });
        }
        await prisma.postLike.create({ data: { postId: id, clientId } });
        const post = await prisma.post.update({ where: { id }, data: { likes: { increment: 1 } } });
        res.json({ liked: true, likes: post.likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── 투표 ──────────────────────────────────────────────────────────────────────
// POST /api/board/:id/poll/vote   body: { clientId, optionId }
router.post('/:id/poll/vote', async (req, res) => {
    const postId = parseInt(req.params.id);
    const { clientId, optionId } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId 필요' });
    if (!optionId) return res.status(400).json({ error: 'optionId 필요' });
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const poll = await prisma.poll.findUnique({
            where: { postId },
            include: { options: true },
        });
        if (!poll) return res.status(404).json({ error: '투표 없음' });

        // 만료 확인
        if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
            return res.status(400).json({ error: '투표가 종료되었습니다.' });
        }

        const option = poll.options.find(o => o.id === parseInt(optionId));
        if (!option) return res.status(400).json({ error: '잘못된 옵션' });

        const existing = await prisma.pollVote.findUnique({
            where: { pollId_clientId: { pollId: poll.id, clientId } },
        });

        if (existing) {
            if (existing.optionId === parseInt(optionId)) {
                // 같은 항목 재클릭 → 투표 취소
                await prisma.$transaction([
                    prisma.pollVote.delete({ where: { id: existing.id } }),
                    prisma.pollOption.update({ where: { id: existing.optionId }, data: { voteCount: { decrement: 1 } } }),
                    prisma.poll.update({ where: { id: poll.id }, data: { totalVotes: { decrement: 1 } } }),
                ]);
                const updated = await prisma.poll.findUnique({ where: { id: poll.id }, include: { options: { orderBy: { id: 'asc' } } } });
                return res.json({ myVoteOptionId: null, poll: updated });
            }
            // 다른 항목으로 변경
            await prisma.$transaction([
                prisma.pollVote.update({ where: { id: existing.id }, data: { optionId: parseInt(optionId) } }),
                prisma.pollOption.update({ where: { id: existing.optionId }, data: { voteCount: { decrement: 1 } } }),
                prisma.pollOption.update({ where: { id: parseInt(optionId) }, data: { voteCount: { increment: 1 } } }),
            ]);
        } else {
            // 신규 투표
            await prisma.$transaction([
                prisma.pollVote.create({ data: { pollId: poll.id, optionId: parseInt(optionId), clientId } }),
                prisma.pollOption.update({ where: { id: parseInt(optionId) }, data: { voteCount: { increment: 1 } } }),
                prisma.poll.update({ where: { id: poll.id }, data: { totalVotes: { increment: 1 } } }),
            ]);
        }

        const updated = await prisma.poll.findUnique({ where: { id: poll.id }, include: { options: { orderBy: { id: 'asc' } } } });
        res.json({ myVoteOptionId: parseInt(optionId), poll: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── 댓글 작성 ─────────────────────────────────────────────────────────────────
// POST /api/board/:id/comments
router.post('/:id/comments', async (req, res) => {
    const postId = parseInt(req.params.id);
    const { content, nickname } = req.body;
    if (!content?.trim() || !nickname?.trim()) {
        return res.status(400).json({ error: '내용과 닉네임은 필수입니다.' });
    }
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });
    try {
        const comment = await prisma.comment.create({
            data: { postId, content: content.trim(), nickname: nickname.trim() },
        });
        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── 댓글 삭제 ─────────────────────────────────────────────────────────────────
// DELETE /api/board/:id/comments/:cid
router.delete('/:id/comments/:cid', async (req, res) => {
    const cid = parseInt(req.params.cid);
    const { nickname } = req.body;
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid id' });
    try {
        const c = await prisma.comment.findUnique({ where: { id: cid } });
        if (!c) return res.status(404).json({ error: 'Not found' });
        if (c.nickname !== nickname) return res.status(403).json({ error: '작성자만 삭제 가능합니다.' });
        await prisma.comment.delete({ where: { id: cid } });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/board/seed - 더미 게시글 씨드 (최초 1회)
router.post('/seed', async (req, res) => {
    try {
        const count = await prisma.post.count();
        if (count > 20) {
            return res.json({ ok: true, message: `이미 ${count}건 존재, 씨드 건너뜀` });
        }
        const { seed } = require('../scripts/seedPosts');
        const created = await seed();
        res.json({ ok: true, created });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
