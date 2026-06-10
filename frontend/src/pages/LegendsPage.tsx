import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── 역대 기록 데이터 ──────────────────────────────────────────────────────────
const TOP_APPEARANCES = [
    { rank: 1,  name: '라이언 긱스',        nameEn: 'Ryan Giggs',        apps: 963,  years: '1990–2014', img: 'https://img.a.transfermarkt.technology/portrait/big/5490-1441272017.jpg' },
    { rank: 2,  name: '바비 찰튼',          nameEn: 'Bobby Charlton',    apps: 758,  years: '1956–1973', img: 'https://img.a.transfermarkt.technology/portrait/big/2548-1442925905.jpg' },
    { rank: 3,  name: '빌 폴크스',          nameEn: 'Bill Foulkes',      apps: 688,  years: '1952–1970', img: '' },
    { rank: 4,  name: '팔 스콜스',          nameEn: 'Paul Scholes',      apps: 718,  years: '1993–2013', img: 'https://img.a.transfermarkt.technology/portrait/big/11665-1481040481.jpg' },
    { rank: 5,  name: '게리 네빌',          nameEn: 'Gary Neville',      apps: 602,  years: '1992–2011', img: 'https://img.a.transfermarkt.technology/portrait/big/11666-1437038012.jpg' },
    { rank: 6,  name: '알렉스 스테프니',    nameEn: 'Alex Stepney',      apps: 539,  years: '1966–1978', img: '' },
    { rank: 7,  name: '토니 던',            nameEn: 'Tony Dunne',        apps: 535,  years: '1960–1973', img: '' },
    { rank: 8,  name: '데니스 어윈',        nameEn: 'Denis Irwin',       apps: 529,  years: '1990–2002', img: 'https://img.a.transfermarkt.technology/portrait/big/11668-1481040481.jpg' },
    { rank: 9,  name: '로이 킨',            nameEn: 'Roy Keane',         apps: 480,  years: '1993–2005', img: 'https://img.a.transfermarkt.technology/portrait/big/11667-1481040481.jpg' },
    { rank: 10, name: '브라이언 롭슨',      nameEn: 'Bryan Robson',      apps: 461,  years: '1981–1994', img: 'https://img.a.transfermarkt.technology/portrait/big/2544-1441968013.jpg' },
];

const TOP_SCORERS = [
    { rank: 1,  name: '웨인 루니',          nameEn: 'Wayne Rooney',      goals: 253, years: '2004–2017', img: 'https://img.a.transfermarkt.technology/portrait/big/2814-1492076714.jpg' },
    { rank: 2,  name: '바비 찰튼',          nameEn: 'Bobby Charlton',    goals: 249, years: '1956–1973', img: 'https://img.a.transfermarkt.technology/portrait/big/2548-1442925905.jpg' },
    { rank: 3,  name: '데니스 로',          nameEn: 'Denis Law',         goals: 237, years: '1962–1973', img: '' },
    { rank: 4,  name: '잭 롤리',            nameEn: 'Jack Rowley',       goals: 211, years: '1937–1955', img: '' },
    { rank: 5,  name: '크리스티아누 호날두', nameEn: 'Cristiano Ronaldo', goals: 145, years: '2003–2009 / 2021–2022', img: 'https://img.a.transfermarkt.technology/portrait/big/8198-1698767940.jpg' },
    { rank: 6,  name: '라이언 긱스',        nameEn: 'Ryan Giggs',        goals: 168, years: '1990–2014', img: 'https://img.a.transfermarkt.technology/portrait/big/5490-1441272017.jpg' },
    { rank: 7,  name: '조지 베스트',        nameEn: 'George Best',       goals: 179, years: '1963–1974', img: '' },
    { rank: 8,  name: '마커스 래쉬포드',    nameEn: 'Marcus Rashford',   goals: 138, years: '2016–2025', img: 'https://img.a.transfermarkt.technology/portrait/big/314571-1695050400.jpg' },
    { rank: 9,  name: '앤디 콜',            nameEn: 'Andy Cole',         goals: 121, years: '1995–2001', img: '' },
    { rank: 10, name: '루드 반 니스텔로이', nameEn: 'Ruud van Nistelrooy', goals: 150, years: '2001–2006', img: 'https://img.a.transfermarkt.technology/portrait/big/3471-1481040481.jpg' },
];

// ── 역대 명장면/전설 선수 ─────────────────────────────────────────────────────
const LEGENDS = [
    {
        name: '조지 베스트',
        nameEn: 'George Best',
        era: '1963–1974',
        position: '윙',
        desc: '역대 최고의 드리블러 중 하나. \'엘 베아트레스(El Beatle)\'로 불리며 1968년 유러피언컵 우승 주역. 발롱도르 수상(1968).',
        img: '',
        badge: 'ICON',
        badgeCls: 'bg-purple-700',
    },
    {
        name: '바비 찰튼',
        nameEn: 'Bobby Charlton',
        era: '1956–1973',
        position: '미드필더',
        desc: '뮌헨 공항 참사에서 생존해 맨유의 영광을 이끈 레전드. 1968년 유러피언컵, 1966년 월드컵 우승. 구단 역대 2위 득점 758경기 249골.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/2548-1442925905.jpg',
        badge: 'ICON',
        badgeCls: 'bg-purple-700',
    },
    {
        name: '에릭 칸토나',
        nameEn: 'Eric Cantona',
        era: '1992–1997',
        position: '포워드',
        desc: '\'킹 에릭\'. 맨유 왕조의 시작을 알린 상징적 존재. 프리미어리그 창설 초기 4번의 우승을 견인. 칼라 올린 자켓으로 유명.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/2539-1481040481.jpg',
        badge: 'KING',
        badgeCls: 'bg-yellow-700',
    },
    {
        name: '라이언 긱스',
        nameEn: 'Ryan Giggs',
        era: '1990–2014',
        position: '윙 / 미드필더',
        desc: '구단 역대 최다 출장 963경기. 13번의 프리미어리그 우승 포함 트로피 34개. FA컵 5분 기적 드리블은 역대 최고의 골 중 하나.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/5490-1441272017.jpg',
        badge: 'RECORD',
        badgeCls: 'bg-blue-700',
    },
    {
        name: '로이 킨',
        nameEn: 'Roy Keane',
        era: '1993–2005',
        position: '미드필더',
        desc: '역대 최고의 맨유 주장. 1999 트레블의 심장. 유베전 챔피언스리그 준결승 혼자 경기를 뒤집은 전설의 미드필더.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/11667-1481040481.jpg',
        badge: 'CAPTAIN',
        badgeCls: 'bg-red-700',
    },
    {
        name: '크리스티아누 호날두',
        nameEn: 'Cristiano Ronaldo',
        era: '2003–2009 / 2021–2022',
        position: '윙 / 포워드',
        desc: '1기 맨유에서 세계 최고로 성장. 2007-08 챔피언스리그 우승, 발롱도르 수상. 2기는 짧았지만 통산 145골로 영원한 전설.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/8198-1698767940.jpg',
        badge: 'BALLON',
        badgeCls: 'bg-yellow-600',
    },
    {
        name: '팔 스콜스',
        nameEn: 'Paul Scholes',
        era: '1993–2013',
        position: '미드필더',
        desc: '치아비, 지단도 인정한 역대 최고의 패서. 718경기 155골. 은퇴 후 복귀한 맨유 원클럽맨. 12번의 리그 우승.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/11665-1481040481.jpg',
        badge: 'MAESTRO',
        badgeCls: 'bg-green-700',
    },
    {
        name: '웨인 루니',
        nameEn: 'Wayne Rooney',
        era: '2004–2017',
        position: '포워드',
        desc: '구단 역대 최다 득점자 253골. 18세 챔피언스리그 데뷔전 해트트릭. 2011년 맨시티 전 오버헤드킥은 역대 최고의 골 중 하나.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/2814-1492076714.jpg',
        badge: 'ALLTIME',
        badgeCls: 'bg-red-600',
    },
    {
        name: '彼터 슈마이켈',
        nameEn: 'Peter Schmeichel',
        era: '1991–1999',
        position: '골키퍼',
        desc: '역대 최고의 골키퍼 중 하나. 1999 트레블의 주역이자 주장. 393경기 출장. 맨유 역사상 가장 위대한 키퍼.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/3459-1481040481.jpg',
        badge: 'KEEPER',
        badgeCls: 'bg-cyan-700',
    },
    {
        name: '브루누 페르난데스',
        nameEn: 'Bruno Fernandes',
        era: '2020–현재',
        position: '어태킹 미드필더',
        desc: '2020년 1월 영입 이후 맨유 역대 최고의 미드필더 중 하나로 평가. 첫 풀시즌 23골 14어시스트. 현역 전설.',
        img: 'https://img.a.transfermarkt.technology/portrait/big/240306-1695657600.jpg',
        badge: 'CURRENT',
        badgeCls: 'bg-orange-700',
    },
];

// ── 트로피 캐비닛 ─────────────────────────────────────────────────────────────
const TROPHIES = [
    { name: '프리미어리그', count: 20, icon: '🏆', years: '1993, 94, 96, 97, 99, 00, 01, 03, 07, 08, 09, 10, 11, 12, 13 외' },
    { name: '챔피언스리그', count: 3,  icon: '⭐', years: '1968, 1999, 2008' },
    { name: 'FA컵',         count: 13, icon: '🥇', years: '1909, 1948, 1963, 1977, 1983, 1985, 1990, 1994, 1996, 1999, 2004, 2016, 2024' },
    { name: '리그컵',       count: 6,  icon: '🥈', years: '1992, 2006, 2009, 2010, 2017, 2023' },
    { name: '유러피언컵우승자컵', count: 1, icon: '🏅', years: '1991' },
    { name: '인터콘티넨탈컵', count: 1, icon: '🌍', years: '1999' },
    { name: 'UEFA 슈퍼컵', count: 1,  icon: '✨', years: '1991' },
    { name: 'FA 커뮤니티 실드', count: 21, icon: '🎖️', years: '다수' },
];

// ── 시대별 명경 ───────────────────────────────────────────────────────────────
const ERAS = [
    {
        era: '버즈비 베이브스',
        years: '1950년대',
        color: 'from-amber-900 to-amber-950',
        border: 'border-amber-700/40',
        desc: '맷 버즈비 감독이 이끈 젊은 선수들. 1958년 뮌헨 공항 참사로 8명의 선수를 잃었지만 구단은 재건해 1968년 유러피언컵 우승.',
        key: ['바비 찰튼', '덩컨 에드워즈', '로저 번'],
    },
    {
        era: '베스트의 시대',
        years: '1960년대',
        color: 'from-purple-900 to-purple-950',
        border: 'border-purple-700/40',
        desc: '조지 베스트, 데니스 로, 바비 찰튼의 3인방이 이끈 황금기. 1968년 영국 클럽 최초 유러피언컵 우승.',
        key: ['조지 베스트', '데니스 로', '바비 찰튼'],
    },
    {
        era: '퍼거슨 왕조',
        years: '1986–2013',
        color: 'from-red-900 to-red-950',
        border: 'border-red-700/40',
        desc: '알렉스 퍼거슨 감독의 27년. 프리미어리그 13회, 챔피언스리그 2회 포함 트로피 38개. 1999년 트레블 달성.',
        key: ['라이언 긱스', '에릭 칸토나', '로이 킨', '팔 스콜스', '크리스티아누 호날두'],
    },
    {
        era: '포스트 퍼거슨',
        years: '2013–현재',
        color: 'from-gray-800 to-gray-900',
        border: 'border-gray-600/40',
        desc: '감독 교체가 잦아진 격동의 시기. 무리뉴의 리그컵·유로파, 텐하흐의 FA컵 우승. 이네오스 인수 후 재건 중.',
        key: ['웨인 루니', '마커스 래쉬포드', '브루누 페르난데스'],
    },
];

const RECORD_TABS = ['전설 선수', '최다 출장', '최다 득점', '트로피', '시대별 역사'] as const;
type RecordTab = typeof RECORD_TABS[number];

export default function LegendsPage() {
    const [tab, setTab] = useState<RecordTab>('전설 선수');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
            {/* 헤더 배너 */}
            <div className="relative bg-gradient-to-b from-red-950 via-[#1e0a0a] to-[#1a1a1a] pt-8 pb-6 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[url('/logo.png')] bg-center bg-no-repeat bg-contain" />
                <p className="text-red-400/70 text-xs uppercase tracking-[0.3em] mb-2">Manchester United</p>
                <h1 className="text-2xl font-black text-white tracking-tight">명예의 전당</h1>
                <p className="text-gray-400 text-xs mt-1">역대 기록 · 전설 · 트로피 캐비닛</p>
            </div>

            {/* 탭 */}
            <div className="sticky top-0 z-20 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/5">
                <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1.5 max-w-2xl mx-auto">
                    {RECORD_TABS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-colors ${
                                tab === t
                                    ? 'bg-red-700 text-white'
                                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-5">

                {/* ── 전설 선수 ─────────────────────────────────── */}
                {tab === '전설 선수' && (
                    <div className="space-y-4">
                        {LEGENDS.map(l => (
                            <div key={l.nameEn} className="bg-[#252525] rounded-2xl overflow-hidden">
                                <div className="flex gap-4 p-4">
                                    <div className="shrink-0">
                                        {l.img ? (
                                            <img
                                                src={l.img}
                                                alt={l.name}
                                                className="w-16 h-16 rounded-xl object-cover bg-[#1a1a1a]"
                                                onError={e => {
                                                    (e.target as HTMLImageElement).src = '';
                                                    (e.target as HTMLImageElement).className = 'w-16 h-16 rounded-xl bg-gradient-to-br from-red-900/40 to-[#1a1a1a] flex items-center justify-center';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-900/40 to-[#1a1a1a] flex items-center justify-center">
                                                <span className="text-2xl">👤</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="text-sm font-bold text-white">{l.name}</h3>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${l.badgeCls} text-white`}>
                                                {l.badge}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] text-red-400 font-medium">{l.position}</span>
                                            <span className="text-[10px] text-gray-600">{l.era}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">{l.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── 최다 출장 ─────────────────────────────────── */}
                {tab === '최다 출장' && (
                    <div className="bg-[#252525] rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5">
                            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">역대 최다 출장</p>
                        </div>
                        {TOP_APPEARANCES.sort((a, b) => b.apps - a.apps).map((p, i) => (
                            <div
                                key={p.nameEn}
                                className={`flex items-center gap-4 px-5 py-3.5 border-b border-gray-800/40 last:border-0 ${i < 3 ? 'bg-gradient-to-r from-yellow-950/20 to-transparent' : ''}`}
                            >
                                <span className={`w-6 text-center text-sm font-black shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                                    {i + 1}
                                </span>
                                {p.img ? (
                                    <img src={p.img} alt={p.name} className="w-9 h-9 rounded-full object-cover bg-[#1a1a1a] shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#333] shrink-0 flex items-center justify-center">
                                        <span className="text-sm">👤</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white">{p.name}</p>
                                    <p className="text-[10px] text-gray-500">{p.years}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-base font-black text-white">{p.apps}</p>
                                    <p className="text-[10px] text-gray-600">경기</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── 최다 득점 ─────────────────────────────────── */}
                {tab === '최다 득점' && (
                    <div className="bg-[#252525] rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5">
                            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">역대 최다 득점</p>
                        </div>
                        {TOP_SCORERS.sort((a, b) => b.goals - a.goals).map((p, i) => (
                            <div
                                key={p.nameEn}
                                className={`flex items-center gap-4 px-5 py-3.5 border-b border-gray-800/40 last:border-0 ${i < 3 ? 'bg-gradient-to-r from-red-950/30 to-transparent' : ''}`}
                            >
                                <span className={`w-6 text-center text-sm font-black shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                                    {i + 1}
                                </span>
                                {p.img ? (
                                    <img src={p.img} alt={p.name} className="w-9 h-9 rounded-full object-cover bg-[#1a1a1a] shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#333] shrink-0 flex items-center justify-center">
                                        <span className="text-sm">⚽</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white">{p.name}</p>
                                    <p className="text-[10px] text-gray-500">{p.years}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-base font-black text-red-400">{p.goals}</p>
                                    <p className="text-[10px] text-gray-600">골</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── 트로피 캐비닛 ─────────────────────────────── */}
                {tab === '트로피' && (
                    <div className="space-y-3">
                        {/* 총계 배너 */}
                        <div className="bg-gradient-to-r from-red-900/40 to-[#252525] rounded-2xl p-5 text-center">
                            <p className="text-5xl font-black text-white">
                                {TROPHIES.reduce((s, t) => s + t.count, 0)}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">역대 메이저 트로피</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {TROPHIES.map(t => (
                                <div key={t.name} className="bg-[#252525] rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{t.icon}</span>
                                        <span className="text-xs text-gray-300 font-semibold leading-tight">{t.name}</span>
                                    </div>
                                    <p className="text-3xl font-black text-white mb-1">{t.count}<span className="text-base text-gray-600 font-normal">회</span></p>
                                    <p className="text-[10px] text-gray-600 leading-relaxed">{t.years}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 시대별 역사 ──────────────────────────────── */}
                {tab === '시대별 역사' && (
                    <div className="relative">
                        {/* 타임라인 세로선 */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-700 via-red-900 to-transparent" />
                        <div className="space-y-6 pl-14">
                            {ERAS.map((era, i) => (
                                <div key={era.era} className="relative">
                                    {/* 타임라인 점 */}
                                    <div className="absolute -left-14 top-4 w-4 h-4 rounded-full bg-red-700 border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                    <div className={`bg-gradient-to-br ${era.color} border ${era.border} rounded-2xl p-5`}>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <h3 className="text-base font-bold text-white">{era.era}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">{era.years}</p>
                                            </div>
                                            <span className="shrink-0 text-xs bg-red-900/60 text-red-300 px-2 py-1 rounded-lg">
                                                {i + 1}시대
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 leading-relaxed mb-3">{era.desc}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {era.key.map(k => (
                                                <span key={k} className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-lg">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
