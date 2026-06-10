import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';

interface NewsItem {
    id: number;
    title: string;
    summary?: string;
    url: string;
    imageUrl?: string;
    pressName?: string;
    pressLogoUrl?: string;
    publishedAt: string;
}

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 60) return `${diffMin}\ubd84 \uc804`;
    if (diffHour < 24) return `${diffHour}\uc2dc\uac04 \uc804`;
    if (diffDay < 7) return `${diffDay}\uc77c \uc804`;
    return `${d.getMonth() + 1}\uc6d4 ${d.getDate()}\uc77c`;
};

function cleanTitle(title: string) {
    return title.replace(/\s*-\s*[^-]+$/, '').trim();
}

function extractPress(title: string, pressName?: string) {
    if (pressName && pressName !== 'Google News') return pressName;
    const match = title.match(/\s*-\s*([^-]+)$/);
    return match ? match[1].trim() : null;
}

const NewsPage = () => {
    const navigate = useNavigate();
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    const fetchNews = useCallback(async (p: number) => {
        try {
            const res = await axios.get(`/api/news?limit=${PAGE_SIZE}&offset=${(p - 1) * PAGE_SIZE}`);
            const data: NewsItem[] = res.data.news ?? [];
            if (p === 1) {
                setNewsList(data);
            } else {
                setNewsList(prev => [...prev, ...data]);
            }
            setHasMore(data.length === PAGE_SIZE);
        } catch {
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNews(1); }, [fetchNews]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchNews(next);
    };

    return (
        <div className="min-h-screen">
            <div className="pt-6 pb-4 flex justify-center">
                <Logo size="large" />
            </div>

            <div className="container mx-auto px-4 pb-10 max-w-4xl">
                <div className="bg-[#545454] rounded-lg p-4 mb-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        {'\u2190 \ud648\uc73c\ub85c'}
                    </button>
                    <span className="text-gray-600">|</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-red-600 rounded" />
                        <h1 className="text-xl font-bold text-white">{'\ub9e8\uc720 \ucd5c\uc2e0 \ub274\uc2a4'}</h1>
                    </div>
                </div>

                <div className="bg-[#545454] rounded-lg p-4 space-y-3">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-[#2e2d2d] rounded-lg p-4 animate-pulse flex gap-4">
                                <div className="w-24 h-16 bg-gray-600 rounded flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-600 rounded" />
                                    <div className="h-3 bg-gray-600 rounded w-3/4" />
                                    <div className="h-3 bg-gray-600 rounded w-1/4" />
                                </div>
                            </div>
                        ))
                    ) : newsList.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            {'\ub274\uc2a4\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.'}
                        </div>
                    ) : (
                        newsList.map(news => {
                            const press = extractPress(news.title, news.pressName);
                            const title = cleanTitle(news.title);
                            return (
                                <a
                                    key={news.id}
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#2e2d2d] rounded-lg p-4 flex gap-4 hover:bg-[#3a3939] transition-colors block"
                                >
                                    {news.imageUrl && (
                                        <img
                                            src={news.imageUrl}
                                            alt="thumbnail"
                                            className="w-28 h-20 object-cover rounded flex-shrink-0"
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 hover:text-red-400 transition-colors">
                                            {title}
                                        </h3>
                                        {news.summary && (
                                            <p className="text-gray-400 text-xs line-clamp-2 mb-2">{news.summary}</p>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {news.pressLogoUrl && (
                                                <img src={news.pressLogoUrl} className="w-3 h-3 rounded" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
                                            )}
                                            {press && <span>{press}</span>}
                                            {press && <span>{'\u00b7'}</span>}
                                            <span>{formatDate(news.publishedAt)}</span>
                                        </div>
                                    </div>
                                </a>
                            );
                        })
                    )}

                    {hasMore && !loading && (
                        <button
                            onClick={loadMore}
                            className="w-full py-3 bg-[#2e2d2d] text-gray-300 hover:text-white hover:bg-[#3e3d3d] rounded-lg text-sm transition-colors"
                        >
                            {'\ub354 \ubcf4\uae30'}
                        </button>
                    )}
                </div>
            </div>

            <div className="text-center text-gray-500 text-sm pb-6">
                ? OnlyUnited All Rights Reserved.
            </div>
        </div>
    );
};

export default NewsPage;
