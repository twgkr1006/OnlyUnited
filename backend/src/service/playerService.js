// src/service/playerService.js
const axios = require('axios');
const prisma = require('../lib/prisma'); // 경로는 프로젝트 기준

const TEAM_ID = 33; // Man United
const API_KEY = process.env.API_FOOTBALL_KEY; // *.env 확인!

// 1) 스쿼드 가져오기: 무조건 배열 반환
async function fetchManUtdSquad() {
    const headers = { 'x-apisports-key': API_KEY };

    // 우선 squads 엔드포인트 시도 (현재 스쿼드)
    try {
        const { data } = await axios.get(
            `https://v3.football.api-sports.io/players/squads?team=${TEAM_ID}`,
            { headers }
        );
        const arr = data?.response?.[0]?.players ?? [];
        if (Array.isArray(arr) && arr.length > 0) return arr; // 성공적으로 배열
    } catch (e) {
        console.warn('[PLAYER SYNC] squads 호출 실패 → players로 폴백:', e?.response?.status, e?.message);
    }

    // 폴백: 시즌별 players
    try {
        const season = new Date().getFullYear(); // 2025 시즌 등
        const { data } = await axios.get(
            `https://v3.football.api-sports.io/players`,
            { headers, params: { team: TEAM_ID, season } }
        );
        // players 엔드포인트는 response가 [{ player, statistics }, ...]
        const arr = data?.response ?? [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        console.error('[PLAYER SYNC] players 호출도 실패:', e?.response?.status, e?.message);
        return [];
    }
}

// 2) DB upsert: 모양 차이 흡수해서 매핑
async function syncManUtdSquadToDB() {
    const raw = await fetchManUtdSquad();

    if (!Array.isArray(raw)) {
        console.error('[PLAYER SYNC] fetchManUtdSquad()가 배열이 아님. 값:', raw);
        return;
    }
    console.log(`[PLAYER SYNC] 동기화 대상 ${raw.length}명`);

    for (const item of raw) {
        // 두 응답 케이스를 모두 처리
        const pid = item.id ?? item.player?.id;
        const name = item.name ?? item.player?.name;
        const first = item.firstname ?? item.player?.firstname ?? null;
        const last = item.lastname ?? item.player?.lastname ?? null;
        const nat = item.nationality ?? item.player?.nationality ?? null;
        const bdateStr = item.birth?.date ?? item.player?.birth?.date ?? null;
        const bdate = bdateStr ? new Date(bdateStr) : null;
        const pos = item.position ?? item.statistics?.[0]?.games?.position ?? null;
        const photo = item.photo ?? item.player?.photo ?? null;

        if (!pid || !name) {
            console.warn('[PLAYER SYNC] 필수 필드 없음 → 스킵:', { pid, name });
            continue;
        }

        const baseData = {
            name,
            ...(first ? { firstname: first } : {}),
            ...(last ? { lastname: last } : {}),
            nationality: nat ?? null,
            birthDate: bdate,
            position: pos ?? null,
            photo: photo ?? null,
        };

        await prisma.player.upsert({
            where: { playerId: Number(pid) },
            update: baseData,
            create: { playerId: Number(pid), ...baseData },
        });
    }

    console.log('✅ 선수 동기화 완료');
}

module.exports = { fetchManUtdSquad, syncManUtdSquadToDB };
