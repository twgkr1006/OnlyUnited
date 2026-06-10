const express = require('express');
const axios = require('axios');
const prisma = require('../prisma');
const { fetchFPLStats, findFPLStats } = require('../service/fplScraper');

const router = express.Router();

const AF_BASE = 'https://v3.football.api-sports.io';
const PL_LEAGUE_ID = 39;
const AF_FALLBACK_SEASON = 2024;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

function afHeaders() {
    return { 'x-apisports-key': process.env.API_FOOTBALL_KEY };
}

// GET /api/players/:playerId - DB 기본 정보
router.get('/:playerId', async (req, res) => {
    const playerId = parseInt(req.params.playerId);
    if (isNaN(playerId)) return res.status(400).json({ error: 'Invalid id' });
    try {
        const player = await prisma.player.findUnique({ where: { playerId } });
        if (!player) return res.status(404).json({ error: 'Not found' });
        res.json(player);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/players/:playerId/stats
// 우선순위: FPL(2025-26) → API-Football 2024 폴백 → DB 기본정보만
router.get('/:playerId/stats', async (req, res) => {
    const playerId = parseInt(req.params.playerId);
    if (isNaN(playerId)) return res.status(400).json({ error: 'Invalid id' });

    try {
        // 1) DB 기본 선수 정보
        const playerDb = await prisma.player.findUnique({ where: { playerId } });

        // 2) DB 캐시 확인
        const cached = await prisma.playerStats.findUnique({ where: { playerId } });
        const isFresh = cached && (Date.now() - new Date(cached.updatedAt).getTime()) < CACHE_TTL_MS;
        if (isFresh && cached.statsJson) {
            const parsed = JSON.parse(cached.statsJson);
            if (!parsed.playerDb && playerDb) parsed.playerDb = playerDb;
            return res.json(parsed);
        }

        // 3) FPL API (2025-26 시즌) 시도
        let fplStats = null;
        try {
            const fplMap = await fetchFPLStats();
            if (playerDb?.name) {
                fplStats = findFPLStats(fplMap, playerDb.name);
            }
        } catch (fplErr) {
            console.warn('[PlayerStats] FPL 실패:', fplErr.message);
        }

        if (fplStats) {
            const result = {
                playerDb,
                player: null,
                stats: convertFPLToApiFormat(fplStats),
                fplExtra: fplStats, // xG, xA 등 FPL 전용 데이터
                source: 'fpl',
                season: '2025-26',
            };
            await cacheStats(playerId, result);
            return res.json(result);
        }

        // 4) API-Football 2024-25 폴백
        let apiData = null;
        try {
            const { data } = await axios.get(`${AF_BASE}/players`, {
                headers: afHeaders(),
                params: { id: playerId, season: AF_FALLBACK_SEASON, league: PL_LEAGUE_ID },
                timeout: 12000,
            });
            apiData = data?.response?.[0] ?? null;
        } catch (apiErr) {
            console.warn('[PlayerStats] API-Football 실패:', apiErr?.response?.status);
        }

        let plStats = null;
        let apiPlayer = null;
        if (apiData) {
            apiPlayer = apiData.player;
            const arr = apiData.statistics ?? [];
            plStats = arr.find(s => s.league?.id === PL_LEAGUE_ID) || arr[0] || null;
        }

        const result = {
            playerDb,
            player: apiPlayer,
            stats: plStats,
            fplExtra: null,
            source: 'api-football',
            season: '2024-25',
        };
        if (apiData) await cacheStats(playerId, result);
        res.json(result);

    } catch (err) {
        console.error('[PlayerStats]', err.message);
        res.status(500).json({ error: err.message });
    }
});

async function cacheStats(playerId, result) {
    await prisma.playerStats.upsert({
        where: { playerId },
        update: { statsJson: JSON.stringify(result), season: 2025 },
        create: { playerId, season: 2025, statsJson: JSON.stringify(result) },
    });
}

/**
 * FPL 스탯 → API-Football 호환 포맷 변환
 */
function convertFPLToApiFormat(fpl) {
    return {
        games: {
            appearences: fpl.starts ?? 0,
            lineups:     fpl.starts ?? 0,
            minutes:     fpl.minutes ?? 0,
            rating:      null,
            position:    null,
        },
        goals: {
            total:    fpl.goals ?? 0,
            assists:  fpl.assists ?? 0,
            saves:    fpl.saves ?? 0,
            conceded: fpl.goalsConceded ?? 0,
        },
        shots: { total: null, on: null },
        passes: { total: null, key: null, accuracy: null },
        tackles: {
            total:         fpl.tackles ?? null,
            blocks:        null,
            interceptions: fpl.cbi ?? null,
        },
        duels:    { total: null, won: null },
        dribbles: { attempts: null, success: null },
        fouls:    { drawn: null, committed: null },
        cards: {
            yellow:    fpl.yellow ?? 0,
            yellowred: 0,
            red:       fpl.red ?? 0,
        },
        penalty: {
            scored: null,
            missed: fpl.penaltiesMissed ?? 0,
            saved:  fpl.penaltiesSaved ?? 0,
        },
        // 확장 필드
        cleanSheets: fpl.cleanSheets ?? null,
        xg:  fpl.xg,
        xa:  fpl.xa,
        xgi: fpl.xgi,
        ictIndex:   fpl.ictIndex,
        influence:  fpl.influence,
        creativity: fpl.creativity,
        threat:     fpl.threat,
        form:       fpl.form,
        cbi:        fpl.cbi,
        recoveries: fpl.recoveries,
    };
}

module.exports = router;
