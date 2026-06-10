const express = require('express');
const axios   = require('axios');
const prisma  = require('../prisma');
const router  = express.Router();

// ── Google Translate 비공식 API (API 키 불필요) ───────────────────────────────
const TRANSLATE_DELAY = 300; // ms — 요청 간 딜레이 (속도 제한 방지)
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function translateToKo(text) {
    if (!text || !text.trim()) return null;
    try {
        const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx', sl: 'en', tl: 'ko', dt: 't',
                q: text.slice(0, 800),   // 최대 800자
            },
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        // 응답 구조: [ [[translated, original, ...], ...], ... ]
        const segments = data?.[0];
        if (!Array.isArray(segments)) return null;
        return segments.map(s => s?.[0] ?? '').join('').trim() || null;
    } catch {
        return null;
    }
}

// ── RSS 피드 목록 ─────────────────────────────────────────────────────────────
const RSS_FEEDS = [
    {
        name: 'BBC Man Utd',
        url:  'https://feeds.bbci.co.uk/sport/football/teams/manchester-united/rss.xml',
        muOnly: true,   // 이미 맨유 전용
    },
    {
        name: 'Sky Sports Football',
        url:  'https://www.skysports.com/rss/12040',
        muOnly: false,
    },
    {
        name: 'The Guardian Football',
        url:  'https://www.theguardian.com/football/rss',
        muOnly: false,
    },
    {
        name: 'ESPN FC',
        url:  'https://www.espn.com/espn/rss/soccer/news',
        muOnly: false,
    },
];

// ── 맨유 관련 키워드 ──────────────────────────────────────────────────────────
const MU_KEYWORDS = [
    'manchester united', 'man utd', 'man united', 'mufc',
    'old trafford', 'ineos', 'ratcliffe',
    'amorim', 'ruben amorim',
];

// ── 이적 관련 키워드 ──────────────────────────────────────────────────────────
const TRANSFER_KEYWORDS = [
    'transfer', 'sign', 'signing', 'deal', 'bid', 'contract', 'loan',
    'agree', 'agreed', 'sell', 'buy', 'fee', 'target', 'swap', 'release',
    'permanent', 'extend', 'renew', 'wage', 'offer', 'approach',
    '이적', '영입', '계약', '임대',
];

function isMuRelated(text) {
    const t = text.toLowerCase();
    return MU_KEYWORDS.some(k => t.includes(k));
}

function isTransferRelated(text) {
    const t = text.toLowerCase();
    return TRANSFER_KEYWORDS.some(k => t.includes(k));
}

// ── RSS XML 파싱 ──────────────────────────────────────────────────────────────
function parseRSSItems(xml, sourceName, muOnly) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
        const c = m[1];
        const clean = s => (s ?? '')
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
            .trim();

        const title   = clean(c.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
        const link    = clean(c.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? c.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]);
        const guid    = clean(c.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]) || link;
        const desc    = clean(c.match(/<description>([\s\S]*?)<\/description>/)?.[1]);
        const pubStr  = c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
        const imgUrl  = c.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1]
                     ?? c.match(/<enclosure[^>]+url="([^"]+)"/)?.[1]
                     ?? c.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
                     ?? null;

        if (!title || !guid) continue;
        const pubDate = pubStr ? new Date(pubStr) : new Date();
        if (isNaN(pubDate.getTime())) continue;

        // 맨유 관련 여부 체크
        const combined = `${title} ${desc}`;
        if (!muOnly && !isMuRelated(combined)) continue;

        items.push({
            guid,
            title,
            summary:   desc.slice(0, 500) || null,
            link,
            source:    sourceName,
            pubDate,
            imageUrl:  imgUrl,
            isTransfer: isTransferRelated(combined),
        });
    }
    return items;
}

// ── RSS 수집 + DB 저장 ────────────────────────────────────────────────────────
async function fetchAndSave() {
    let saved = 0;
    for (const feed of RSS_FEEDS) {
        try {
            const { data } = await axios.get(feed.url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnlyUnited RSS Reader)' },
            });
            const items = parseRSSItems(data, feed.name, feed.muOnly);
            for (const item of items) {
                try {
                    const existing = await prisma.transferNews.findUnique({
                        where: { guid: item.guid.slice(0, 499) },
                        select: { id: true, titleKo: true },
                    });

                    if (existing) {
                        // 이미 있으면 titleKo 없는 경우만 번역
                        if (!existing.titleKo) {
                            const titleKo = await translateToKo(item.title);
                            await sleep(TRANSLATE_DELAY);
                            const summaryKo = item.summary ? await translateToKo(item.summary) : null;
                            await sleep(TRANSLATE_DELAY);
                            await prisma.transferNews.update({
                                where: { id: existing.id },
                                data: { titleKo, summaryKo, isTransfer: item.isTransfer },
                            });
                        }
                    } else {
                        // 새 기사: 번역 후 저장
                        const titleKo = await translateToKo(item.title);
                        await sleep(TRANSLATE_DELAY);
                        const summaryKo = item.summary ? await translateToKo(item.summary) : null;
                        await sleep(TRANSLATE_DELAY);
                        await prisma.transferNews.create({
                            data: {
                                guid:       item.guid.slice(0, 499),
                                title:      item.title,
                                titleKo:    titleKo?.slice(0, 499) ?? null,
                                summary:    item.summary,
                                summaryKo,
                                link:       item.link.slice(0, 499),
                                source:     item.source,
                                pubDate:    item.pubDate,
                                imageUrl:   item.imageUrl?.slice(0, 499) ?? null,
                                isTransfer: item.isTransfer,
                            },
                        });
                        saved++;
                    }
                } catch {}
            }
        } catch (e) {
            console.warn(`[Transfer RSS] ${feed.name} 실패:`, e.message);
        }
    }
    return saved;
}

// ── 30분마다 자동 갱신 ────────────────────────────────────────────────────────
fetchAndSave().catch(() => {});
setInterval(() => fetchAndSave().catch(() => {}), 30 * 60 * 1000);

// ── GET /api/transfer?tab=all|transfer&page=1 ─────────────────────────────────
router.get('/', async (req, res) => {
    const tab      = req.query.tab ?? 'all';       // 'all' | 'transfer'
    const page     = Math.max(1, parseInt(req.query.page ?? '1'));
    const pageSize = 20;

    try {
        const where = tab === 'transfer' ? { isTransfer: true } : {};
        const [total, items] = await Promise.all([
            prisma.transferNews.count({ where }),
            prisma.transferNews.findMany({
                where,
                orderBy: { pubDate: 'desc' },
                skip:    (page - 1) * pageSize,
                take:    pageSize,
            }),
        ]);
        res.json({ items, total, page, pageSize, hasNext: page * pageSize < total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/transfer/refresh ────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
    try {
        const saved = await fetchAndSave();
        res.json({ saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/transfer/translate-all ─────────────────────────────────────────
// 미번역 기사 일괄 번역 (백그라운드 실행 → 즉시 응답)
router.post('/translate-all', async (req, res) => {
    try {
        const untranslated = await prisma.transferNews.findMany({
            where: { titleKo: null },
            select: { id: true, title: true, summary: true },
            orderBy: { pubDate: 'desc' },
        });
        res.json({ queued: untranslated.length });

        // 응답 후 백그라운드 번역
        (async () => {
            for (const item of untranslated) {
                try {
                    const titleKo = await translateToKo(item.title);
                    await sleep(TRANSLATE_DELAY);
                    const summaryKo = item.summary ? await translateToKo(item.summary) : null;
                    await sleep(TRANSLATE_DELAY);
                    await prisma.transferNews.update({
                        where: { id: item.id },
                        data: { titleKo: titleKo?.slice(0, 499) ?? null, summaryKo },
                    });
                } catch {}
            }
            console.log(`[Transfer] 번역 완료: ${untranslated.length}건`);
        })();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
