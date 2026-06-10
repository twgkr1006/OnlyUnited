const axios = require('axios');
const cron = require('node-cron');
const xml2js = require('xml2js');
const { upsertNews } = require('../service/newsService');

// 맨유 한국어 + 영문 뉴스 RSS
const RSS_URLS = [
    'https://news.google.com/rss/search?q=맨체스터+유나이티드&hl=ko&gl=KR&ceid=KR:ko',
    'https://news.google.com/rss/search?q=Manchester+United&hl=ko&gl=KR&ceid=KR:ko',
];

function extractUrl(item) {
    // link 필드를 우선으로 사용 (guid는 CBMi... 인코딩 값이라 http URL 아님)
    const candidates = [
        item.link?.[0],
        item.guid?.[0]?._ ?? item.guid?.[0],
    ];

    for (const raw of candidates) {
        const url = typeof raw === 'string' ? raw.trim() : '';
        if (url.startsWith('http')) return url;
    }
    return null;
}

const syncNews = async () => {
    let totalSaved = 0;

    for (const RSS_URL of RSS_URLS) {
        try {
            const { data } = await axios.get(RSS_URL, { timeout: 10000 });
            const result = await xml2js.parseStringPromise(data);
            const items = result.rss.channel[0].item ?? [];

            for (const item of items) {
                const title = item.title?.[0] || '제목 없음';
                const url = extractUrl(item);
                const publishedAt = new Date(item.pubDate?.[0]);

                if (!url) {
                    continue;
                }

                const saved = await upsertNews({ title, url, publishedAt });
                if (saved) totalSaved++;
            }

            console.log(`✅ 뉴스 동기화 완료 (${RSS_URL.includes('맨체스터') ? '한국어' : '영문'}): ${items.length}건 처리`);
        } catch (err) {
            console.error('❌ 뉴스 동기화 실패:', err.message);
        }
    }

    console.log(`📰 이번 동기화에서 새로 저장된 뉴스: ${totalSaved}건`);
};

// 매 30분마다 실행 + 서버 시작 시 1회
cron.schedule('*/30 * * * *', syncNews);
syncNews();

module.exports = syncNews;
