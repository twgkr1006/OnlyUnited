const axios = require('axios');
const cheerio = require('cheerio');
const prisma = require('../prisma');

const pressLogoMap = {
    '네이트 뉴스': 'https://news.nate.com/favicon.ico',
    '머니투데이': 'https://img.mt.co.kr/favicon.ico',
    '스포탈코리아': 'https://www.sportalkorea.com/favicon.ico',
    '네이트 스포츠': 'https://sports.nate.com/favicon.ico',
    '조선일보': 'https://www.chosun.com/favicon.ico',
    '인터풋볼': 'https://www.interfootball.co.kr/favicon.ico',
    '마이데일리': 'https://www.mydaily.co.kr/favicon.ico',
    '스포츠조선': 'https://sports.chosun.com/favicon.ico',
    '데일리안': 'https://www.dailian.co.kr/favicon.ico',
};

// 제목 정규화: 모든 종류 따옴표 제거 + 언론사 suffix 제거
function baseTitleOf(title) {
    return title
        // ASCII + 유니코드 따옴표 전부 제거
        .replace(/['"''""\`‛‚„‟\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F]/g, '')
        // 마지막 " - 언론사명" 제거
        .replace(/\s*[-–—]\s*[^-–—]+$/, '')
        .trim()
        .toLowerCase()
        // 공백, 줄임표, 점을 공백 하나로
        .replace(/[\s…\.]+/g, ' ')
        .trim();
}

async function extractOgTags(url) {
    try {
        const { data } = await axios.get(url, {
            maxRedirects: 5,
            timeout: 6000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnlyUnitedBot/1.0)' },
        });

        const $ = cheerio.load(data);

        let imageUrl = $('meta[property="og:image"]').attr('content') || null;
        let pressName = $('meta[property="og:site_name"]').attr('content') || null;
        const summary = $('meta[property="og:description"]').attr('content') || null;

        if (imageUrl?.includes('googleusercontent') || imageUrl?.includes('news.google.com')) {
            imageUrl = null;
        }

        // Google News 자체 OG 태그인 경우 pressName 무효화
        if (pressName === 'Google News') pressName = null;

        return { imageUrl, pressName, summary: pressName ? summary : null };
    } catch {
        return {};
    }
}

// 제목에서 언론사 추출 (마지막 " - 언론사")
function extractPressFromTitle(title) {
    const match = title.match(/\s*-\s*([^-]+)$/);
    return match ? match[1].trim() : null;
}

async function upsertNews({ title, url, publishedAt }) {
    // URL 중복 체크
    const byUrl = await prisma.news.findFirst({ where: { url } });
    if (byUrl) return false;

    // 기사 본문 제목 기준 중복 체크 (최근 7일)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const base = baseTitleOf(title).slice(0, 80);
    const recentTitles = await prisma.news.findMany({
        where: { publishedAt: { gte: sevenDaysAgo } },
        select: { title: true }
    });
    const isDup = recentTitles.some(n => baseTitleOf(n.title).slice(0, 80) === base);
    if (isDup) return false;

    const { imageUrl, pressName: ogPressName, summary } = await extractOgTags(url);

    // OG에서 못 가져오면 제목 suffix에서 언론사 추출
    const pressName = ogPressName || extractPressFromTitle(title);
    const pressLogoUrl = pressLogoMap[pressName] || null;

    await prisma.news.create({
        data: { title, summary, url, imageUrl, pressName, pressLogoUrl, publishedAt },
    });

    return true;
}

module.exports = { upsertNews };
