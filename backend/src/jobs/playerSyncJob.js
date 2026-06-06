const cron = require('node-cron');
const { syncManUtdSquadToDB } = require('../service/playerService');

(async () => {
    try {
        await syncManUtdSquadToDB();
    } catch (e) {
        console.error('[PLAYER SYNC JOB] 실패:', e);
    }
})();

cron.schedule("0 3 * * *", async () => {
    const count = await syncManUtdSquadToDB();
    console.log(`✅ 선수 ${count}건 동기화 완료`);
}, { timezone: "Asia/Seoul" });

// 서버 시작 시 1회 실행
(async () => {
    const count = await syncManUtdSquadToDB();
    console.log(`🚀 서버 기동 시 선수 ${count}건 초기 동기화 완료`);
})();

module.exports = {};
