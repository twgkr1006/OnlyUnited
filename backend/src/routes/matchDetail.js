const express = require('express');
const axios = require('axios');
const prisma = require('../prisma');
const router = express.Router();

const ESPN_MAN_UTD_ID = '360';

const ESPN_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
};

// ── ESPN: 날짜로 맨유 event ID 검색 ──────────────────────────────────────────
async function findEspnEventId(utcDate) {
    const dt = new Date(utcDate);
    // ESPN은 YYYYMMDD 형식
    const ymd = dt.toISOString().slice(0, 10).replace(/-/g, '');
    try {
        const { data } = await axios.get(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard`,
            { params: { dates: ymd }, headers: ESPN_HEADERS, timeout: 10000 }
        );
        const events = data?.events ?? [];
        const ev = events.find(e => {
            const comps = e.competitions?.[0];
            return comps?.competitors?.some(c => c.team?.id === ESPN_MAN_UTD_ID);
        });
        return ev?.id ?? null;
    } catch (e) {
        console.warn('[DETAIL] ESPN 이벤트 검색 실패:', e?.response?.status ?? e.message);
        return null;
    }
}

// ── ESPN: 경기 상세 전체 fetch ────────────────────────────────────────────────
async function fetchEspnSummary(eventId) {
    if (!eventId) return null;
    try {
        const { data } = await axios.get(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary`,
            { params: { event: eventId }, headers: ESPN_HEADERS, timeout: 10000 }
        );
        return data;
    } catch (e) {
        console.warn('[DETAIL] ESPN summary 실패:', e?.response?.status ?? e.message);
        return null;
    }
}

// ── ESPN 데이터 파싱 ──────────────────────────────────────────────────────────
function parseEspnData(summary, homeTeamId, awayTeamId) {
    if (!summary) return { events: [], teamStats: null, rosters: null, venue: null, officials: [] };

    // ----- 경기 이벤트 (골, 카드) -----
    const KEY_TYPES = ['goal', 'goal---header', 'goal---own-goal', 'penalty-goal',
                       'yellow-card', 'red-card', 'yellow-red-card'];
    const events = (summary.keyEvents ?? [])
        .filter(ev => KEY_TYPES.includes(ev.type?.type))
        .map(ev => {
            const isGoal = ev.type?.type?.includes('goal');
            const isOwnGoal = ev.type?.type?.includes('own-goal');
            const isPenalty = ev.type?.type?.includes('penalty');
            const participants = ev.participants ?? [];
            return {
                minute:     ev.clock?.displayValue ?? '',
                type:       isGoal ? (isOwnGoal ? 'OWN_GOAL' : isPenalty ? 'PENALTY' : 'GOAL') : ev.type?.text,
                kind:       isGoal ? 'goal' : 'card',
                teamId:     ev.team?.id ?? null,
                teamName:   ev.team?.displayName ?? '',
                scorer:     participants[0]?.athlete?.displayName ?? null,
                assist:     isGoal ? (participants[1]?.athlete?.displayName ?? null) : null,
                text:       ev.text ?? ev.shortText ?? '',
            };
        });

    // ----- 팀 스탯 -----
    const teamsRaw = summary.boxscore?.teams ?? [];
    const teamStats = teamsRaw.map(t => ({
        teamId:    t.team?.id,
        teamName:  t.team?.displayName,
        homeAway:  t.homeAway,
        logo:      t.team?.logo,
        stats:     Object.fromEntries(
            (t.statistics ?? []).map(s => [s.name, { value: s.displayValue, label: s.label }])
        ),
    }));

    // ----- 선수 라인업 & 스탯 (맨유만) -----
    const manUtdRoster = (summary.rosters ?? []).find(r => r.team?.id === ESPN_MAN_UTD_ID);
    const rosters = (manUtdRoster?.roster ?? []).map(p => {
        const statMap = {};
        (p.stats ?? []).forEach(s => {
            // PowerShell 문자열로 직렬화된 경우 대비
            if (typeof s === 'object') statMap[s.name] = s.displayValue;
            else if (typeof s === 'string') {
                const m = s.match(/name=(\w+).*?displayValue=([^;}]+)/);
                if (m) statMap[m[1]] = m[2].trim();
            }
        });
        return {
            id:        p.athlete?.id,
            name:      p.athlete?.displayName ?? p.athlete?.fullName,
            jersey:    p.jersey,
            position:  p.position?.abbreviation ?? p.position?.name,
            starter:   !!p.starter,
            subbedIn:  !!p.subbedIn,
            subbedOut: !!p.subbedOut,
            stats:     statMap,
        };
    });

    // ----- 경기장 / 심판 -----
    const gameInfo  = summary.gameInfo ?? {};
    const venue     = gameInfo.venue?.fullName ?? null;
    const officials = (gameInfo.officials ?? []).map(o => ({
        name: o.fullName,
        role: o.position?.displayName ?? o.position?.name ?? '심판',
    }));

    return { events, teamStats, rosters, venue, officials };
}

// ── football-data.org: 하프타임 / 팀 크레스트 ─────────────────────────────────
async function fetchFDBasic(matchId) {
    try {
        const { data } = await axios.get(
            `https://api.football-data.org/v4/matches/${matchId}`,
            { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY }, timeout: 8000 }
        );
        return {
            halfTime:      data.score?.halfTime ?? null,
            homeTeamCrest: data.homeTeam?.crest ?? null,
            awayTeamCrest: data.awayTeam?.crest ?? null,
            homeTla:       data.homeTeam?.tla ?? null,
            awayTla:       data.awayTeam?.tla ?? null,
        };
    } catch {
        return { halfTime: null, homeTeamCrest: null, awayTeamCrest: null };
    }
}

// ── GET /api/matches/:id/detail ─────────────────────────────────────────────
router.get('/:id/detail', async (req, res) => {
    const matchId = req.params.id;
    try {
        const match = await prisma.match.findUnique({ where: { id: BigInt(matchId) } });
        if (!match) return res.status(404).json({ error: '경기를 찾을 수 없습니다.' });

        // 캐시 확인
        const cached = await prisma.matchDetail.findUnique({ where: { matchId } });
        const cacheAge = cached ? (Date.now() - cached.fetchedAt.getTime()) : Infinity;
        const maxAge = match.status === 'FINISHED' ? 48 * 3600 * 1000 : 30 * 60 * 1000;

        if (cached && cacheAge < maxAge) {
            return res.json({
                match:    serialize(match),
                fdBasic:  JSON.parse(cached.goalsJson    || 'null'),
                espn:     JSON.parse(cached.statsJson    || 'null'),
                fromCache: true,
            });
        }

        // 병렬 fetch
        const [fdBasic, espnEventId] = await Promise.all([
            fetchFDBasic(matchId),
            findEspnEventId(match.utcDate),
        ]);

        const espnSummary = await fetchEspnSummary(espnEventId);
        const espn = parseEspnData(espnSummary, match.homeTeamId, match.awayTeamId);

        // DB 캐싱
        await prisma.matchDetail.upsert({
            where:  { matchId },
            update: {
                goalsJson:    JSON.stringify(fdBasic),
                statsJson:    JSON.stringify(espn),
                ratingsJson:  null,
                fetchedAt:    new Date(),
            },
            create: {
                matchId,
                goalsJson:    JSON.stringify(fdBasic),
                statsJson:    JSON.stringify(espn),
                ratingsJson:  null,
            },
        });

        res.json({ match: serialize(match), fdBasic, espn });
    } catch (err) {
        console.error('[DETAIL] 오류:', err.message);
        res.status(500).json({ error: '경기 상세 정보를 불러올 수 없습니다.' });
    }
});

// ── YouTube 하이라이트 (RSS 피드 방식 — API 키 불필요) ───────────────────────
// YouTube 공개 RSS: https://www.youtube.com/feeds/videos.xml?channel_id=XXX
// 최근 15개 영상 무료 제공, API 키 불필요
const RSS_CHANNELS = [
    { id: 'UCnBht7BrOx-A328KFXgysqQ', name: '쿠팡플레이 스포츠' },  // @coupangplaysports (축구 포함)
    { id: 'UCDbXo03RR4-euLEnaG8SC1A', name: '맨유 공식' },           // @ManUtd
    { id: 'UCpryVRk_VDudG8SHXgWcG0w', name: '프리미어리그 공식' },   // @premierleague
    { id: 'UCNAf1k0yIjyGu3k9BwAg3lg', name: 'Sky Sports' },           // @skysportsfootball
    { id: 'UClhp9g6TPiqCTOlcw0ROfNg', name: 'TNT Sports' },           // @TNTSportsfootball
];

// RSS XML에서 영상 목록 파싱
function parseRSSFeed(xml, channelName) {
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = entryRegex.exec(xml)) !== null) {
        const c = m[1];
        const videoId    = c.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
        const rawTitle   = c.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
        const title      = rawTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const published  = c.match(/<published>(.*?)<\/published>/)?.[1] ?? '';
        const thumb      = c.match(/url="(https:\/\/i\d*\.ytimg\.com[^"]+)"/)?.[1]
                        ?? (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');
        if (videoId && title) entries.push({ videoId, title, channelName, thumb, publishedAt: published });
    }
    return entries;
}

// 채널 RSS 가져오기
async function fetchChannelRSS(channelId, channelName) {
    try {
        const { data } = await axios.get(
            `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
            { timeout: 8000, headers: { 'Accept': 'application/xml, text/xml' } },
        );
        return parseRSSFeed(data, channelName);
    } catch (e) {
        console.warn(`[RSS] 피드 실패 (${channelId} ${channelName}):`, e.message);
        return [];
    }
}

// 상대팀 이름의 한국어 표기 맵 (쿠팡플레이 스포츠 등 한국 채널 대응)
const OPP_KO_MAP = {
    'arsenal':          ['아스널'],
    'chelsea':          ['첼시'],
    'liverpool':        ['리버풀'],
    'manchester city':  ['맨시티', '맨체스터 시티'],
    'tottenham':        ['토트넘'],
    'newcastle':        ['뉴캐슬'],
    'aston villa':      ['아스톤 빌라', '아스톤빌라'],
    'brighton':         ['브라이튼'],
    'west ham':         ['웨스트햄'],
    'everton':          ['에버턴'],
    'fulham':           ['풀럼'],
    'brentford':        ['브렌트퍼드'],
    'crystal palace':   ['크리스탈 팰리스'],
    'nottingham':       ['노팅엄'],
    'bournemouth':      ['본머스'],
    'wolverhampton':    ['울버햄튼', '울브스'],
    'leicester':        ['레스터'],
    'southampton':      ['사우샘프턴'],
    'ipswich':          ['입스위치'],
    'luton':            ['루턴'],
    'burnley':          ['번리'],
    'sheffield':        ['셰필드'],
    'sunderland':       ['선덜랜드'],
    'leeds':            ['리즈'],
    'watford':          ['왓퍼드'],
    'norwich':          ['노리치'],
    'real madrid':      ['레알 마드리드', '레알마드리드'],
    'barcelona':        ['바르셀로나'],
    'juventus':         ['유벤투스'],
    'inter milan':      ['인테르'],
    'ac milan':         ['밀란'],
    'paris saint':      ['파리 생제르맹', 'psg'],
    'galatasaray':      ['갈라타사라이'],
    'olympique':        ['올랭피크'],
};

// 제목이 해당 경기 하이라이트인지 판정
function isMatchHighlight(title, opp) {
    const t = title.toLowerCase();
    // 하이라이트 키워드
    const isHL = t.includes('highlight') || t.includes('하이라이트') || t.includes('풀 하이라이트') || t.includes('골 장면') || t.includes('match review') || t.includes('extended highlights');
    if (!isHL) return false;
    // 맨유 포함 여부
    const hasMU = t.includes('manchester') || t.includes('man utd') || t.includes('man united') || t.includes('맨유') || t.includes('맨체스터');
    if (!hasMU) return false;

    const oppLower = opp.toLowerCase();
    // 영어 상대팀 매칭: 첫 단어(3자 이상)
    const oppWords = oppLower.split(/\s+/);
    const matchEn = oppWords.some(w => w.length >= 3 && t.includes(w));
    if (matchEn) return true;

    // 한국어 상대팀 매칭
    for (const [key, koNames] of Object.entries(OPP_KO_MAP)) {
        if (oppLower.includes(key) || key.includes(oppLower.split(' ')[0])) {
            if (koNames.some(k => t.includes(k.toLowerCase()))) return true;
        }
    }
    // 직접 한국어 제목에 상대팀 이름 일부가 포함됐는지 (3자 이상 영어단어)
    return false;
}

async function fetchHighlightsForMatch(match) {
    const isHome = match.homeTeam === 'Manchester United';
    const opp    = isHome ? match.awayTeam : match.homeTeam;
    const matchDate = new Date(match.utcDate);

    // 모든 채널 RSS 병렬 수집
    const allFeeds = await Promise.all(
        RSS_CHANNELS.map(ch => fetchChannelRSS(ch.id, ch.name))
    );

    const seen = new Set();
    const results = [];

    for (const feed of allFeeds) {
        for (const video of feed) {
            if (seen.has(video.videoId)) continue;
            // 경기일 기준 ±3일 이내 업로드된 영상만 허용
            const diff = Math.abs(new Date(video.publishedAt) - matchDate);
            const withinRange = diff < 1000 * 60 * 60 * 24 * 3;
            if (withinRange && isMatchHighlight(video.title, opp)) {
                seen.add(video.videoId);
                results.push(video);
            }
        }
    }

    // 날짜 범위 내 결과 없으면 날짜 무시하고 제목만으로 재시도 (과거 경기 대응)
    if (results.length === 0) {
        for (const feed of allFeeds) {
            for (const video of feed) {
                if (seen.has(video.videoId)) continue;
                if (isMatchHighlight(video.title, opp)) {
                    seen.add(video.videoId);
                    results.push(video);
                }
            }
        }
    }

    return results.slice(0, 6);
}

// ── GET /api/matches/:id/highlights ─────────────────────────────────────────
router.get('/:id/highlights', async (req, res) => {
    const matchId = req.params.id;
    try {
        const detail = await prisma.matchDetail.findUnique({ where: { matchId } });
        if (detail?.highlightsJson) {
            return res.json({ highlights: JSON.parse(detail.highlightsJson), source: 'cache' });
        }

        // 경기 정보 조회 후 RSS 검색
        const match = await prisma.match.findUnique({ where: { id: BigInt(matchId) } });
        if (!match) return res.status(404).json({ error: '경기 없음' });

        const highlights = await fetchHighlightsForMatch(match);

        // MatchDetail에 저장 (없으면 생략, 있으면 업데이트)
        if (detail) {
            await prisma.matchDetail.update({
                where: { matchId },
                data: { highlightsJson: JSON.stringify(highlights) },
            });
        }

        res.json({ highlights, source: 'rss' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/matches/:id/highlights ─────────────────────────────────────────
// 사용자가 YouTube URL을 직접 추가 / 자동 재검색
// body: { videoUrl? } or {} (빈 body = 자동 재검색)
router.post('/:id/highlights', async (req, res) => {
    const matchId = req.params.id;
    const { videoUrl } = req.body;

    try {
        const detail = await prisma.matchDetail.findUnique({ where: { matchId } });
        const existing = detail?.highlightsJson ? JSON.parse(detail.highlightsJson) : [];

        if (videoUrl) {
            // YouTube URL에서 videoId 파싱
            const match = videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
            if (!match) return res.status(400).json({ error: '유효한 YouTube URL이 아닙니다.' });
            const videoId = match[1];

            // 중복 방지
            if (existing.some(h => h.videoId === videoId)) {
                return res.json({ highlights: existing });
            }

            // YouTube oEmbed로 제목 조회
            let title = '직접 추가된 영상', channelName = '';
            try {
                const { data } = await axios.get(`https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`, { timeout: 5000 });
                title = data.title ?? title;
                channelName = data.author_name ?? '';
            } catch {}

            const newEntry = { videoId, title, channelName, thumb: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, publishedAt: new Date().toISOString() };
            const updated = [...existing, newEntry];

            if (detail) await prisma.matchDetail.update({ where: { matchId }, data: { highlightsJson: JSON.stringify(updated) } });
            return res.json({ highlights: updated });
        }

        // 자동 재검색 요청
        const matchRow = await prisma.match.findUnique({ where: { id: BigInt(matchId) } });
        if (!matchRow) return res.status(404).json({ error: '경기 없음' });

        const highlights = await fetchHighlightsForMatch(matchRow);
        if (detail) await prisma.matchDetail.update({ where: { matchId }, data: { highlightsJson: JSON.stringify(highlights) } });
        res.json({ highlights, source: 'rss' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/matches/:id/ratings?clientId=xxx ────────────────────────────────
// 경기 내 전체 선수 평점 집계 반환
router.get('/:id/ratings', async (req, res) => {
    const matchId  = req.params.id;
    const clientId = req.query.clientId ?? null;

    try {
        const rows = await prisma.matchRating.findMany({ where: { matchId } });

        // playerName 기준으로 집계
        const map = {};
        for (const r of rows) {
            if (!map[r.playerName]) map[r.playerName] = { total: 0, count: 0, myRating: null };
            map[r.playerName].total += r.rating;
            map[r.playerName].count += 1;
            if (clientId && r.clientId === clientId) map[r.playerName].myRating = r.rating;
        }

        const result = {};
        for (const [name, d] of Object.entries(map)) {
            result[name] = {
                fanAvg:   Math.round((d.total / d.count) * 10) / 10,
                count:    d.count,
                myRating: d.myRating,
            };
        }

        res.json({ ratings: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/matches/:id/ratings ────────────────────────────────────────────
// body: { clientId, playerName, rating (1-10) }
router.post('/:id/ratings', async (req, res) => {
    const matchId  = req.params.id;
    const { clientId, playerName, rating } = req.body;

    if (!clientId || !playerName) return res.status(400).json({ error: 'clientId, playerName 필수' });
    const r = parseFloat(rating);
    if (isNaN(r) || r < 1 || r > 10) return res.status(400).json({ error: '평점은 1~10 사이' });

    try {
        // upsert (이미 평점을 줬으면 업데이트)
        await prisma.matchRating.upsert({
            where: { matchId_playerName_clientId: { matchId, playerName, clientId } },
            update: { rating: r },
            create: { matchId, playerName, clientId, rating: r },
        });

        // 해당 선수 최신 집계 반환
        const rows = await prisma.matchRating.findMany({ where: { matchId, playerName } });
        const total = rows.reduce((s, x) => s + x.rating, 0);
        const count = rows.length;

        res.json({
            playerName,
            fanAvg:   Math.round((total / count) * 10) / 10,
            count,
            myRating: r,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function serialize(m) {
    return { ...m, id: m.id.toString(), homeTeamId: m.homeTeamId ?? null, awayTeamId: m.awayTeamId ?? null };
}

module.exports = router;
