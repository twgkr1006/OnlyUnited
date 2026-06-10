import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

interface TransferNewsItem {
    id: number;
    guid: string;
    title: string;
    titleKo: string | null;
    summary: string | null;
    summaryKo: string | null;
    link: string;
    source: string;
    pubDate: string;
    imageUrl: string | null;
    isTransfer: boolean;
}

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
    'BBC Man Utd':          { label: 'BBC', cls: 'bg-red-800 text-red-100' },
    'Sky Sports Football':  { label: 'Sky', cls: 'bg-blue-800 text-blue-100' },
    'The Guardian Football':{ label: 'Guardian', cls: 'bg-[#1a533a] text-green-200' },
    'ESPN FC':              { label: 'ESPN', cls: 'bg-yellow-800 text-yellow-100' },
};

function formatRelative(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60)  return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
}

export default function TransferPage() {
    const [items, setItems]         = useState<TransferNewsItem[]>([]);
    const [tab, setTab]             = useState<'all' | 'transfer'>('all');
    const [page, setPage]           = useState(1);
    const [hasNext, setHasNext]     = useState(false);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [translating, setTranslating] = useState(false);
    const [total, setTotal]         = useState(0);

    const load = useCallback(async (currentTab: 'all' | 'transfer', currentPage: number, append = false) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/transfer', { params: { tab: currentTab, page: currentPage } });
            setItems(prev => append ? [...prev, ...res.data.items] : res.data.items);
            setHasNext(res.data.hasNext);
            setTotal(res.data.total);
        } catch {}
        setLoading(false);
    }, []);

    useEffect(() => {
        setPage(1);
        setItems([]);
        load(tab, 1, false);
    }, [tab]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await axios.post('/api/transfer/refresh');
            await load(tab, 1, false);
            setPage(1);
        } catch {}
        setRefreshing(false);
    };

    const handleTranslateAll = async () => {
        setTranslating(true);
        try {
            const res = await axios.post('/api/transfer/translate-all');
            const queued = res.data.queued ?? 0;
            if (queued > 0) {
                // 번역 완료까지 잠시 대기 후 새로고침
                setTimeout(async () => {
                    await load(tab, 1, false);
                    setPage(1);
                    setTranslating(false);
                }, Math.min(queued * 700, 15000));
            } else {
                setTranslating(false);
            }
        } catch { setTranslating(false); }
    };

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        load(tab, next, true);
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
            {/* 헤더 */}
            <div className="sticky top-0 z-30 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-sm font-bold text-white">이적 & 뉴스</h1>
                        <p className="text-[10px] text-gray-500 mt-0.5">BBC · Sky Sports · Guardian · ESPN</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleTranslateAll}
                            disabled={translating || refreshing}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
                        >
                            {translating ? (
                                <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-blue-200 rounded-full animate-spin" />
                            ) : '🌐'}
                            {translating ? '번역 중...' : '한국어 번역'}
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing || translating}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                        >
                            <span className={refreshing ? 'inline-block animate-spin' : ''}>🔄</span>
                            {refreshing ? '갱신 중...' : '새로고침'}
                        </button>
                    </div>
                </div>

                {/* 탭 */}
                <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-2">
                    {(['all', 'transfer'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                                tab === t
                                    ? 'bg-red-700 text-white'
                                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                            }`}
                        >
                            {t === 'all' ? '전체 뉴스' : '🔴 이적 루머'}
                        </button>
                    ))}
                    {total > 0 && (
                        <span className="ml-auto text-[10px] text-gray-600 self-center">{total}개</span>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
                {loading && items.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-[#252525] rounded-2xl h-24 animate-pulse" />
                    ))
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-3xl mb-3">📰</p>
                        <p className="text-sm">뉴스가 없습니다.</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 text-xs text-red-400 hover:text-red-300"
                        >
                            🔄 RSS 새로 불러오기
                        </button>
                    </div>
                ) : (
                    <>
                        {items.map(item => (
                            <NewsCard key={item.id} item={item} />
                        ))}
                        {hasNext && (
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="w-full py-3 text-sm text-gray-400 hover:text-white bg-[#252525] hover:bg-[#2e2e2e] rounded-2xl transition-colors disabled:opacity-40"
                            >
                                {loading ? '로딩 중...' : '더 보기'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function NewsCard({ item }: { item: TransferNewsItem }) {
    const badge = SOURCE_BADGE[item.source] ?? { label: item.source, cls: 'bg-gray-700 text-gray-300' };
    const displayTitle   = item.titleKo   || item.title;
    const displaySummary = item.summaryKo || item.summary;
    const isTranslated   = !!item.titleKo;

    return (
        <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="block group"
        >
            <div className="bg-[#252525] hover:bg-[#2d2d2d] border border-transparent hover:border-red-900/30 rounded-2xl overflow-hidden transition-all">
                <div className="flex gap-3 p-4">
                    {/* 썸네일 */}
                    {item.imageUrl ? (
                        <div className="shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-[#1a1a1a]">
                            <img
                                src={item.imageUrl}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                    ) : (
                        <div className="shrink-0 w-20 h-16 rounded-xl bg-gradient-to-br from-red-950/60 to-[#1a1a1a] flex items-center justify-center">
                            <span className="text-2xl opacity-60">⚽</span>
                        </div>
                    )}

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
                                {badge.label}
                            </span>
                            {item.isTransfer && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-800/70 text-amber-200">
                                    🔴 이적
                                </span>
                            )}
                            {!isTranslated && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-500">
                                    EN
                                </span>
                            )}
                            <span className="text-[10px] text-gray-600 ml-auto shrink-0">
                                {formatRelative(item.pubDate)}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-200 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                            {displayTitle}
                        </p>
                        {displaySummary && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {displaySummary}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </a>
    );
}
