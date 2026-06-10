const axios = require('axios');
const cheerio = require('cheerio');

// FBRef 맨유 팀 ID 및 2025-26 시즌 스탯 페이지
const FBREF_MANUTD_URL = 'https://fbref.com/en/squads/19538602/2025-2026/Manchester-United-Stats';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

let _cache = null;
let _cacheTime = 0;

/**
 * FBRef 맨유 팀 스탯 페이지를 스크랩하여 선수별 2025-26 PL 스탯 반환
 * 반환 형태: { [playerName]: { apps, goals, assists, xg, xa, minutes, yellow, red, ... } }
 */
async function fetchFBRefTeamStats() {
    // 메모리 캐시 확인
    if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) {
        return _cache;
    }

    const { data: html } = await axios.get(FBREF_MANUTD_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xhtml,*/*;q=0.8',
        },
        timeout: 15000,
    });

    const $ = cheerio.load(html);
    const stats = {};

    // FBRef standard stats table: id="stats_standard_9" (PL)
    // 테이블이 여러 개일 수 있으므로 id가 stats_standard로 시작하는 것을 모두 확인
    $('table[id^="stats_standard"]').each((_, table) => {
        $(table).find('tbody tr').each((_, row) => {
            const $row = $(row);
            if ($row.hasClass('thead') || $row.hasClass('over_header')) return;

            const nameEl = $row.find('[data-stat="player"] a');
            const name = nameEl.text().trim();
            if (!name) return;

            const get = (stat) => {
                const val = $row.find(`[data-stat="${stat}"]`).text().trim();
                return val === '' || val === null ? null : parseFloat(val) || 0;
            };

            stats[name] = {
                appearances: get('games'),
                starts:      get('games_starts'),
                minutes:     get('minutes'),
                goals:       get('goals'),
                assists:     get('assists'),
                xg:          get('xg'),
                xa:          get('xg_assist'),
                npxg:        get('npxg'),
                shots:       get('shots'),
                shotsOnTarget: get('shots_on_target'),
                yellow:      get('cards_yellow'),
                red:         get('cards_red'),
                pk:          get('pens_made'),
                pkAtt:       get('pens_att'),
                age:         $row.find('[data-stat="age"]').text().trim(),
                pos:         $row.find('[data-stat="position"]').text().trim(),
                nation:      $row.find('[data-stat="nationality"] a').last().text().trim(),
            };
        });
    });

    if (Object.keys(stats).length > 0) {
        _cache = stats;
        _cacheTime = Date.now();
        console.log(`[FBRef] ${Object.keys(stats).length}명 스탯 스크랩 완료 (2025-26)`);
    }

    return stats;
}

/**
 * 선수 이름으로 FBRef 스탯 검색 (퍼지 매칭 포함)
 */
function findPlayerStats(allStats, playerName) {
    if (!allStats || !playerName) return null;

    // 정확히 일치
    if (allStats[playerName]) return allStats[playerName];

    // 이름 일부 매칭 (성만 또는 이름만)
    const lower = playerName.toLowerCase();
    const parts = lower.split(' ');

    for (const [key, val] of Object.entries(allStats)) {
        const keyLower = key.toLowerCase();
        // 이름 전체가 포함되는지
        if (keyLower.includes(lower) || lower.includes(keyLower)) return val;
        // 성(last word)만으로 매칭
        const lastName = parts[parts.length - 1];
        if (lastName.length > 3 && keyLower.includes(lastName)) return val;
    }

    return null;
}

module.exports = { fetchFBRefTeamStats, findPlayerStats };
