import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface NewsItem {
    id: string;
    title: string;
    summary?: string;
    url: string;
    imageUrl?: string;
    pressName?: string;
    pressLogoUrl?: string;
    publishedAt?: string;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

function cleanTitle(title: string) {
    return title.replace(/\s*-\s*[^-]+$/, '').trim();
}

function extractPress(title: string, pressName?: string) {
    if (pressName && pressName !== 'Google News') return pressName;
    const match = title.match(/\s*-\s*([^-]+)$/);
    return match ? match[1].trim() : 'Google News';
}

const MainNews = () => {
    const navigate = useNavigate();
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/news?limit=6')
            .then(res => {
                const news = Array.isArray(res.data) ? res.data : (res.data.news || []);
                setNewsList(news);
            })
            .catch(() => setNewsList([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">맨유 뉴스</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-[#2e2d2d] rounded-xl overflow-hidden animate-pulse">
                            <div className="h-32 bg-gray-700" />
                            <div className="p-3 space-y-2">
                                <div className="h-3 bg-gray-600 rounded w-1/3" />
                                <div className="h-4 bg-gray-600 rounded" />
                                <div className="h-4 bg-gray-600 rounded w-4/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (newsList.length === 0) {
        return (
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">맨유 뉴스</h2>
                <p className="text-center py-8 text-gray-400 text-sm">뉴스를 불러오지 못했습니다.</p>
            </div>
        );
    }

    const featured = newsList[0];
    const rest = newsList.slice(1);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">맨유 뉴스</h2>
                <button
                    onClick={() => navigate('/news')}
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                >
                    전체 보기 →
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 헤드라인 뉴스 (큰 카드) */}
                <a
                    href={featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="md:col-span-2 group relative rounded-xl overflow-hidden bg-[#2e2d2d] block"
                    style={{ minHeight: '200px' }}
                >
                    {featured.imageUrl ? (
                        <>
                            <img
                                src={featured.imageUrl}
                                alt={cleanTitle(featured.title)}
                                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                            {/* 이미지 위 그라디언트 오버레이 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded font-medium">헤드라인</span>
                                    <span className="text-gray-300 text-xs">{extractPress(featured.title, featured.pressName)}</span>
                                    {featured.publishedAt && (
                                        <span className="text-gray-400 text-xs">· {formatDate(featured.publishedAt)}</span>
                                    )}
                                </div>
                                <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-red-300 transition-colors">
                                    {cleanTitle(featured.title)}
                                </h3>
                                {featured.summary && (
                                    <p className="text-gray-300 text-xs mt-1 line-clamp-2">{featured.summary}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-4 h-full flex flex-col justify-end min-h-[200px] bg-gradient-to-b from-[#3a3939] to-[#2e2d2d]">
                            <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded font-medium mb-2 w-fit">헤드라인</span>
                            <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-red-300 transition-colors">
                                {cleanTitle(featured.title)}
                            </h3>
                        </div>
                    )}
                </a>

                {/* 나머지 뉴스 목록 */}
                <div className="flex flex-col gap-2">
                    {rest.slice(0, 4).map(news => {
                        const press = extractPress(news.title, news.pressName);
                        const title = cleanTitle(news.title);
                        return (
                            <a
                                key={news.id}
                                href={news.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-[#2e2d2d] hover:bg-[#3a3939] rounded-xl p-3 flex gap-3 transition-colors"
                            >
                                {news.imageUrl && (
                                    <img
                                        src={news.imageUrl}
                                        alt={title}
                                        className="w-16 h-14 object-cover rounded-lg flex-shrink-0"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-gray-500 text-xs truncate">{press}</span>
                                        {news.publishedAt && (
                                            <span className="text-gray-600 text-xs flex-shrink-0">· {formatDate(news.publishedAt)}</span>
                                        )}
                                    </div>
                                    <p className="text-white text-xs font-medium line-clamp-2 group-hover:text-red-300 transition-colors leading-snug">
                                        {title}
                                    </p>
                                </div>
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MainNews;
