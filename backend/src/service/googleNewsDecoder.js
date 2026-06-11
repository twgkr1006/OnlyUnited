const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
};

async function fetchDecodedBatchExecute(id) {
    const s =
        '[[["Fbv4je","[\\"garturlreq\\",[[\\"en-US\\",\\"US\\",[\\"FINANCE_TOP_INDICES\\",\\"WEB_TEST_1_0_0\\"],null,null,1,1,\\"US:en\\",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],\\"en-US\\",\\"US\\",1,[2,3,4,8],1,0,\\"655000234\\",0,0,null,0],\\"' +
        id +
        '\\"]",null,"generic"]]]';

    const { data } = await axios.post(
        'https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je',
        'f.req=' + encodeURIComponent(s),
        {
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                Referer: 'https://news.google.com/',
            },
            timeout: 10000,
        }
    );

    const text = String(data);
    const header = '["garturlres","';
    const footer = '",';
    const idx = text.indexOf(header);
    if (idx === -1) throw new Error('garturlres header not found');
    const start = text.substring(idx + header.length);
    const end = start.indexOf(footer);
    if (end === -1) throw new Error('garturlres footer not found');
    return start.substring(0, end);
}

async function decodeViaSplashPage(sourceUrl) {
    const response = await axios.get(sourceUrl, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    const data = $('c-wiz[data-p]').attr('data-p');
    if (!data) throw new Error('c-wiz data-p not found');

    const obj = JSON.parse(data.replace('%.@.', '["garturlreq",'));
    const payload = {
        'f.req': JSON.stringify([[['Fbv4je', JSON.stringify([...obj.slice(0, -6), ...obj.slice(-2)]), 'null', 'generic']]]),
    };

    const postResponse = await axios.post(
        'https://news.google.com/_/DotsSplashUi/data/batchexecute',
        payload,
        {
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            timeout: 10000,
        }
    );

    const raw = String(postResponse.data).replace(/^\)\]\}'/, '');
    return JSON.parse(JSON.parse(raw)[0][2])[1];
}

function decodeBase64Article(base64) {
    try {
        let str = Buffer.from(base64, 'base64').toString('binary');

        const prefix = Buffer.from([0x08, 0x13, 0x22]).toString('binary');
        if (str.startsWith(prefix)) str = str.substring(prefix.length);

        const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString('binary');
        if (str.endsWith(suffix)) str = str.substring(0, str.length - suffix.length);

        const bytes = Uint8Array.from(str, c => c.charCodeAt(0));
        const len = bytes[0];
        if (len >= 0x80) {
            str = str.substring(2, len + 2);
        } else {
            str = str.substring(1, len + 1);
        }

        if (str.startsWith('http')) return str;
    } catch {
        // fall through
    }
    return null;
}

async function decodeGoogleNewsUrl(sourceUrl) {
    try {
        const url = new URL(sourceUrl);
        const parts = url.pathname.split('/');
        const articlesIdx = parts.indexOf('articles');
        if (url.hostname !== 'news.google.com' || articlesIdx === -1) {
            return sourceUrl;
        }

        const base64 = parts[articlesIdx + 1];
        if (!base64) return sourceUrl;

        const offline = decodeBase64Article(base64);
        if (offline) return offline;

        try {
            return await decodeViaSplashPage(sourceUrl);
        } catch {
            return await fetchDecodedBatchExecute(base64);
        }
    } catch (err) {
        console.warn('[GoogleNewsDecoder] decode failed:', err.message);
        return sourceUrl;
    }
}

function isGoogleNewsUrl(url) {
    try {
        const u = new URL(url);
        return u.hostname === 'news.google.com' && u.pathname.includes('/articles/');
    } catch {
        return false;
    }
}

module.exports = { decodeGoogleNewsUrl, isGoogleNewsUrl };
