const axios = require('axios');

const FPL_API = 'https://fantasy.premierleague.com/api/bootstrap-static/';
const MAN_UTD_FPL_TEAM_ID = 14;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

let _cache = null;
let _cacheTime = 0;

/**
 * FPL API에서 맨유 선수 전체 2025-26 시즌 스탯을 가져옴
 * 반환: { [fullName]: { ...stats } }
 */
async function fetchFPLStats() {
    if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) {
        return _cache;
    }

    const { data } = await axios.get(FPL_API, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000,
    });

    const players = (data.elements || []).filter(p => p.team === MAN_UTD_FPL_TEAM_ID && !p.removed);

    const map = {};
    for (const p of players) {
        const fullName = `${p.first_name} ${p.second_name}`.trim();
        const webName  = p.web_name || '';

        // appearances 추정: (minutes / 90) 은 부정확 → starts 사용
        const appearances = p.starts != null ? Math.round(p.starts + Math.max(0, (p.minutes - p.starts * 75) / 30)) : null;

        map[fullName] = {
            webName,
            optaCode: p.opta_code ?? null,
            fplId: p.id,
            appearances: p.starts ?? null,
            starts: p.starts ?? null,
            minutes: p.minutes ?? null,
            goals: p.goals_scored ?? 0,
            assists: p.assists ?? 0,
            cleanSheets: p.clean_sheets ?? 0,
            goalsConceded: p.goals_conceded ?? 0,
            ownGoals: p.own_goals ?? 0,
            saves: p.saves ?? 0,
            yellow: p.yellow_cards ?? 0,
            red: p.red_cards ?? 0,
            penaltiesMissed: p.penalties_missed ?? 0,
            penaltiesSaved: p.penalties_saved ?? 0,
            bonus: p.bonus ?? 0,
            // 공격 스탯
            xg:  parseFloat(p.expected_goals)  || 0,
            xa:  parseFloat(p.expected_assists) || 0,
            xgi: parseFloat(p.expected_goal_involvements) || 0,
            xgPer90:  p.expected_goals_per_90  ?? null,
            xaPer90:  p.expected_assists_per_90 ?? null,
            // 수비 스탯
            tackles: p.tackles ?? null,
            cbi:     p.clearances_blocks_interceptions ?? null,
            recoveries: p.recoveries ?? null,
            defensiveContribution: p.defensive_contribution ?? null,
            // 영향력 지수
            influence:  parseFloat(p.influence)  || 0,
            creativity: parseFloat(p.creativity) || 0,
            threat:     parseFloat(p.threat)     || 0,
            ictIndex:   parseFloat(p.ict_index)  || 0,
            form:       parseFloat(p.form)       || 0,
            // 부상/상태
            status: p.status ?? 'a',
            news: p.news ?? '',
            chanceNextRound: p.chance_of_playing_next_round,
        };
    }

    _cache = map;
    _cacheTime = Date.now();
    console.log(`[FPL] 맨유 ${players.length}명 2025-26 스탯 수신 완료`);
    return map;
}

/**
 * 특수문자 정규화 (터키어 ı→i, 악센트 제거 등)
 */
function normalize(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // 결합 악센트 제거 (é→e, ö→o 등)
        .replace(/[ıİ]/g, 'i')          // 터키식 점 없는 i
        .replace(/[ğĞ]/g, 'g')
        .replace(/[şŞ]/g, 's')
        .replace(/[çÇ]/g, 'c')
        .replace(/[ñÑ]/g, 'n')
        .replace(/[žŽ]/g, 'z')
        .toLowerCase()
        .trim();
}

/**
 * API-Football 선수 이름으로 FPL 스탯 검색 (퍼지 매칭 + 특수문자 정규화)
 */
function findFPLStats(fplMap, playerName) {
    if (!fplMap || !playerName) return null;

    const norm = normalize(playerName);

    // 1) 정규화 완전 일치
    for (const [key, val] of Object.entries(fplMap)) {
        if (normalize(key) === norm) return val;
    }

    // 2) webName 정규화 일치
    for (const [, val] of Object.entries(fplMap)) {
        if (val.webName && normalize(val.webName) === norm) return val;
    }

    // 3) 이름 포함 여부 (정규화 후)
    for (const [key, val] of Object.entries(fplMap)) {
        const kn = normalize(key);
        if (kn.includes(norm) || norm.includes(kn)) return val;
    }

    // 4) 성(last word) 매칭 — "B. Mbeumo" → "mbeumo"
    const parts = norm.split(/[\s.]+/).filter(Boolean);
    const lastName = parts[parts.length - 1];
    if (lastName.length >= 4) {
        for (const [key, val] of Object.entries(fplMap)) {
            const kn = normalize(key);
            if (kn.includes(lastName)) return val;
        }
    }

    // 5) 이니셜 + 성 매칭 — "A. Bayindir" → initial='a', last='bayindir'
    if (parts.length >= 2 && parts[0].length === 1) {
        const initial = parts[0];
        const last = parts[parts.length - 1];
        for (const [key, val] of Object.entries(fplMap)) {
            const kn = normalize(key);
            const kParts = kn.split(' ');
            if (kParts.length >= 2 && kParts[0].startsWith(initial) && kParts[kParts.length - 1] === last) {
                return val;
            }
        }
    }

    return null;
}

module.exports = { fetchFPLStats, findFPLStats };
