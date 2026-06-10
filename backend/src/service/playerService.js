const axios = require('axios');
const prisma = require('../prisma');
const shirtNumberMap = require('../data/manutdShirtNumbers.json').numbers;

// football-data.org: Man United = 66
const FD_TEAM_ID = 66;
const FD_BASE = 'https://api.football-data.org/v4';

// api-sports.io (API-Football): Man United = 33
const AF_TEAM_ID = 33;
const AF_BASE = 'https://v3.football.api-sports.io';

function fdHeaders() {
    return { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY };
}
function afHeaders() {
    return { 'x-apisports-key': process.env.API_FOOTBALL_KEY };
}

// ── API-Football에서 선수 목록 가져오기 (사진 + 등번호 포함) ────────────────
async function fetchFromApiFootball() {
    if (!process.env.API_FOOTBALL_KEY) return null;
    try {
        const { data } = await axios.get(`${AF_BASE}/players/squads`, {
            headers: afHeaders(),
            params: { team: AF_TEAM_ID },
            timeout: 10000,
        });
        const players = data?.response?.[0]?.players ?? [];
        if (players.length > 0) {
            console.log(`[PLAYER SYNC] API-Football에서 ${players.length}명 수신`);
            return players; // { id, name, age, number, position, photo }
        }
        return null;
    } catch (e) {
        console.warn('[PLAYER SYNC] API-Football 실패:', e?.response?.status, e?.message);
        return null;
    }
}

// ── football-data.org에서 선수 목록 가져오기 (기본 정보만) ──────────────────
async function fetchFromFootballData() {
    try {
        const { data } = await axios.get(`${FD_BASE}/teams/${FD_TEAM_ID}`, {
            headers: fdHeaders(),
            timeout: 10000,
        });
        const squad = data?.squad ?? [];
        if (squad.length > 0) {
            console.log(`[PLAYER SYNC] football-data.org에서 ${squad.length}명 수신`);
        }
        return squad; // { id, name, position, dateOfBirth, nationality }
    } catch (e) {
        console.error('[PLAYER SYNC] football-data.org 실패:', e?.response?.status, e?.message);
        return [];
    }
}

// ── 두 소스를 합쳐서 DB에 저장 ───────────────────────────────────────────────
async function syncManUtdSquadToDB() {
    // 1) API-Football 우선 시도
    const afPlayers = await fetchFromApiFootball();

    if (afPlayers && afPlayers.length > 0) {
        // API-Football 응답만으로 처리 (사진 + 등번호 포함)
        let count = 0;
        for (const p of afPlayers) {
            const pid = p.id;
            const name = p.name;
            if (!pid || !name) continue;

            const bdate = p.birth?.date ? new Date(p.birth.date) : null;
            const age = p.age != null ? Number(p.age)
                : (bdate ? Math.floor((Date.now() - bdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null);

            await prisma.player.upsert({
                where: { playerId: Number(pid) },
                update: {
                    name,
                    age,
                    shirtNumber: p.number != null ? Number(p.number) : null,
                    nationality: p.nationality ?? null,
                    birthDate: bdate,
                    position: p.position ?? null,
                    photo: p.photo ?? null,
                },
                create: {
                    playerId: Number(pid),
                    name,
                    firstname: null,
                    lastname: null,
                    age,
                    shirtNumber: p.number != null ? Number(p.number) : null,
                    nationality: p.nationality ?? null,
                    birthDate: bdate,
                    position: p.position ?? null,
                    photo: p.photo ?? null,
                },
            });
            count++;
        }
        console.log(`✅ 선수 동기화 완료 (API-Football): ${count}명`);
        return count;
    }

    // 2) fallback: football-data.org (사진 없음)
    const fdSquad = await fetchFromFootballData();
    console.log(`[PLAYER SYNC] 동기화 대상 ${fdSquad.length}명`);

    let count = 0;
    for (const item of fdSquad) {
        const pid = item.id;
        const name = item.name;
        if (!pid || !name) continue;

        const bdate = item.dateOfBirth ? new Date(item.dateOfBirth) : null;
        const age = bdate
            ? Math.floor((Date.now() - bdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null;

        const shirtNumber = item.shirtNumber != null
            ? Number(item.shirtNumber)
            : (shirtNumberMap[String(pid)] ?? null);

        await prisma.player.upsert({
            where: { playerId: Number(pid) },
            update: {
                name,
                age,
                shirtNumber,
                nationality: item.nationality ?? null,
                birthDate: bdate,
                position: item.position ?? null,
                // 기존에 사진이 있으면 덮어쓰지 않음
            },
            create: {
                playerId: Number(pid),
                name,
                firstname: null,
                lastname: null,
                age,
                shirtNumber,
                nationality: item.nationality ?? null,
                birthDate: bdate,
                position: item.position ?? null,
                photo: null,
            },
        });
        count++;
    }
    console.log(`✅ 선수 동기화 완료 (football-data.org): ${count}명`);
    return count;
}

module.exports = { syncManUtdSquadToDB };
