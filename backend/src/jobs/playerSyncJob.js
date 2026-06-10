const cron = require('node-cron');
const { syncManUtdSquadToDB } = require('../service/playerService');

// 서버 시작 시 1회 실행
(async () => {
    try {
        const count = await syncManUtdSquadToDB();
        console.log(`🚀 서버 기동 시 선수 ${count}명 초기 동기화 완료`);
    } catch (e) {
        console.error('[PLAYER SYNC JOB] 초기 동기화 실패:', e);
    }
})();

// 매일 새벽 3시 동기화 (KST)
cron.schedule("0 3 * * *", async () => {
    try {
        const count = await syncManUtdSquadToDB();
        console.log(`✅ 선수 ${count}명 동기화 완료`);
    } catch (e) {
        console.error('[PLAYER SYNC JOB] 정기 동기화 실패:', e);
    }
}, { timezone: "Asia/Seoul" });

module.exports = {};
