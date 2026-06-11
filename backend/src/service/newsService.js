const axios = require('axios');
const cheerio = require('cheerio');
const prisma = require('../prisma');
const { decodeGoogleNewsUrl, isGoogleNewsUrl } = require('./googleNewsDecoder');

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

const FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

function baseTitleOf(title) {
    return title
        .replace(/['"''""\`‛‚„‟\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F]/g, '')
        .replace(/\s*[-–—]\s*[^-–—]+$/, '')
        .trim()
        .toLowerCase()
        .replace(/[\s…\.]+/g, ' ')
        .trim();
}

function isInvalidNewsImage(imageUrl) {
    if (!imageUrl) return true;
    const lower = imageUrl.toLowerCase();
    if (lower.includes('news.google.com')) return true;
    if (lower.includes('favicon')) return true;
    if (lower.includes('google.com/s2/favicons')) return true;
    // Google News RSS 채널 기본 아이콘
    if (lower.includes('lh3.googleusercontent.com/-dr60l-k8vny')) return true;
    return false;
}

function resolveAbsoluteUrl(raw, pageUrl) {
    if (!raw) return null;
    try {
        return new URL(raw, pageUrl).href;
    } catch {
        return raw.startsWith('http') ? raw : null;
    }
}

async function resolveArticleUrl(url) {
    if (!isGoogleNewsUrl(url)) return url;
    const decoded = await decodeGoogleNewsUrl(url);
    if (decoded && decoded.startsWith('http') && !isGoogleNewsUrl(decoded)) {
        return decoded;
    }
    return url;
}

async function extractOgTags(url) {
    try {
        const articleUrl = await resolveArticleUrl(url);
        const { data, request } = await axios.get(articleUrl, {
            maxRedirects: 5,
            timeout: 10000,
            headers: FETCH_HEADERS,
        });

        const finalUrl = request?.res?.responseUrl || articleUrl;
        const $ = cheerio.load(data);

        let imageUrl =
            $('meta[property="og:image"]').attr('content') ||
            $('meta[property="og:image:secure_url"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('meta[name="twitter:image:src"]').attr('content') ||
            $('link[rel="image_src"]').attr('href') ||
            null;

        imageUrl = resolveAbsoluteUrl(imageUrl, finalUrl);
        if (imageUrl?.startsWith('http://')) {
            imageUrl = 'https://' + imageUrl.slice(7);
        }
        if (isInvalidNewsImage(imageUrl)) imageUrl = null;

        let pressName = $('meta[property="og:site_name"]').attr('content') || null;
        const summary = $('meta[property="og:description"]').attr('content') || null;

        if (pressName === 'Google News') pressName = null;

        return { imageUrl, pressName, summary: summary || null, articleUrl: finalUrl };
    } catch (err) {
        console.warn('[NewsService] OG 추출 실패:', url.slice(0, 80), err.message);
        return {};
    }
}

function extractPressFromTitle(title) {
    const match = title.match(/\s*-\s*([^-]+)$/);
    return match ? match[1].trim() : null;
}

async function upsertNews({ title, url, publishedAt, rssSource }) {
    const byUrl = await prisma.news.findFirst({ where: { url } });
    if (byUrl) return false;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const base = baseTitleOf(title).slice(0, 80);
    const recentTitles = await prisma.news.findMany({
        where: { publishedAt: { gte: sevenDaysAgo } },
        select: { title: true },
    });
    const isDup = recentTitles.some(n => baseTitleOf(n.title).slice(0, 80) === base);
    if (isDup) return false;

    const { imageUrl, pressName: ogPressName, summary, articleUrl } = await extractOgTags(url);
    const storedUrl = articleUrl && articleUrl.startsWith('http') ? articleUrl : url;

    const byResolved = storedUrl !== url
        ? await prisma.news.findFirst({ where: { url: storedUrl } })
        : null;
    if (byResolved) return false;

    const pressName = ogPressName || rssSource || extractPressFromTitle(title);
    const pressLogoUrl = pressLogoMap[pressName] || null;

    await prisma.news.create({
        data: { title, summary, url: storedUrl, imageUrl, pressName, pressLogoUrl, publishedAt },
    });

    return true;
}

/** imageUrl 없는 최근 뉴스 OG 이미지 재수집 */
async function refreshMissingImages(limit = 20) {
    const stale = await prisma.news.findMany({
        where: { OR: [{ imageUrl: null }, { imageUrl: '' }] },
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });

    let updated = 0;
    for (const item of stale) {
        const { imageUrl, pressName, summary, articleUrl } = await extractOgTags(item.url);
        if (!imageUrl && !articleUrl) continue;

        await prisma.news.update({
            where: { id: item.id },
            data: {
                ...(imageUrl ? { imageUrl } : {}),
                ...(articleUrl && articleUrl !== item.url ? { url: articleUrl } : {}),
                ...(pressName && !item.pressName ? { pressName } : {}),
                ...(summary && !item.summary ? { summary } : {}),
            },
        });
        if (imageUrl) updated++;
    }

    if (updated > 0) console.log(`🖼️ 뉴스 썸네일 ${updated}건 보완`);
    return updated;
}

module.exports = { upsertNews, refreshMissingImages, extractOgTags };
