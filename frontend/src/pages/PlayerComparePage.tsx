import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// ── 공유 데이터 (PlayerDetailPage와 동일) ──────────────────────────────────
const playerNameKoMap: Record<string, string> = {
  'Bruno Fernandes': '\ube0c\ub8e8\ub178 \ud398\ub974\ub09c\ub370\uc2a4',
  'Marcus Rashford': '\ub9c8\ucfec\uc2a4 \ub798\uc26c\ud3ec\ub4dc',
  'Harry Maguire': '\ud574\ub9ac \ub9c8\uacfc\uc774\uc5b4',
  'Luke Shaw': '\ub8e8\ud06c \uc1fc',
  'Diogo Dalot': '\ub514\uc624\uace0 \ub2ec\ub85c\ud2b8',
  'Casemiro': '\uce74\uc138\ubbf8\ub8e8',
  'Lisandro Martinez': '\ub9ac\uc0b0\ub4dc\ub85c \ub9c8\ub974\ud2f0\ub124\uc2a4',
  'Altay Bayindir': '\uc54c\ud0c0\uc774 \ubca0\uc774\uc778\ub514\ub974',
  'Tyrell Malacia': '\ud2f0\ub80c \ub9d0\ub77c\uc2dc\uc544',
  'Amad Diallo': '\uc544\ub9c8\ub4dc \ub514\uc54c\ub85c',
  'Alejandro Garnacho': '\uc54c\ub808\ud558\ub4dc\ub85c \uac00\ub974\ub098\ucd08',
  'Rasmus Hojlund': '\ub77c\uc2a4\ubb34\uc2a4 \ud76c\uc774\ub8ec\ub4dc',
  'Kobbie Mainoo': '\ucf54\ube44 \ub9c8\uc774\ub204',
  'Manuel Ugarte': '\ub9c8\ub204\uc5d8 \uc6b0\uac00\ub974\ud14c',
  'Leny Yoro': '\ub808\ub2c8 \uc694\ub85c',
  'Joshua Zirkzee': '\uc870\uc288\uc544 \uc9c0\ub974\ud06c\uc81c\uc774',
  'Noussair Mazraoui': '\ub204\uc0ac\uc774\ub974 \ub9c8\uc988\ub77c\uc704',
  'Patrick Dorgu': '\ud328\ud2b8\ub9ad \ub3c4\ub974\uad6c',
  'Mathys Tel': '\ub9c8\ud2f0\uc2a4 \ud154',
  'Andre Onana': '\uc559\ub4dc\ub808 \uc624\ub098\ub098',
  'Mason Mount': '\uba54\uc774\uc2a8 \ub9c8\uc6b4\ud2b8',
};

const playerIdToFullName: Record<number, string> = {
  1485: 'Bruno Fernandes', 886: 'Diogo Dalot', 2467: 'Lisandro Martinez',
  2935: 'Harry Maguire', 284322: 'Kobbie Mainoo', 51494: 'Manuel Ugarte',
  747: 'Casemiro', 891: 'Luke Shaw', 342970: 'Leny Yoro',
  50132: 'Altay Bayindir', 2931: 'Tom Heaton', 157997: 'Amad Diallo',
  70100: 'Joshua Zirkzee', 37145: 'Tyrell Malacia', 382452: 'Patrick Dorgu',
  19960: 'Andre Onana', 359260: 'Alejandro Garnacho', 346837: 'Rasmus Hojlund',
  47765: 'Noussair Mazraoui', 19220: 'Mason Mount', 405553: 'Mathys Tel',
};

const abbreviatedToFullName: Record<string, string> = {
  'K. Mainoo': 'Kobbie Mainoo', 'M. Ugarte': 'Manuel Ugarte',
  'L. Martinez': 'Lisandro Martinez', 'H. Maguire': 'Harry Maguire',
  'D. Dalot': 'Diogo Dalot', 'L. Shaw': 'Luke Shaw', 'L. Yoro': 'Leny Yoro',
  'A. Bayindir': 'Altay Bayindir', 'T. Heaton': 'Tom Heaton',
  'A. Diallo': 'Amad Diallo', 'J. Zirkzee': 'Joshua Zirkzee',
  'T. Malacia': 'Tyrell Malacia', 'P. Dorgu': 'Patrick Dorgu',
  'A. Onana': 'Andre Onana', 'A. Garnacho': 'Alejandro Garnacho',
  'R. Hojlund': 'Rasmus Hojlund', 'N. Mazraoui': 'Noussair Mazraoui',
  'M. Mount': 'Mason Mount', 'M. Tel': 'Mathys Tel',
  'M. Rashford': 'Marcus Rashford', 'B. Fernandes': 'Bruno Fernandes',
};

const playerRadarData: Record<string, number[]> = {
  'Bruno Fernandes':    [92, 83, 62, 79, 70, 96],
  'Alejandro Garnacho': [70, 78, 52, 87, 94, 72],
  'Marcus Rashford':    [68, 76, 50, 88, 96, 70],
  'Rasmus Hojlund':     [62, 86, 44, 88, 91, 68],
  'Kobbie Mainoo':      [86, 66, 78, 86, 76, 90],
  'Manuel Ugarte':      [78, 50, 93, 91, 76, 88],
  'Diogo Dalot':        [77, 68, 84, 88, 84, 82],
  'Lisandro Martinez':  [72, 44, 95, 84, 76, 88],
  'Harry Maguire':      [70, 52, 88, 82, 65, 84],
  'Andre Onana':        [82, 30, 88, 80, 64, 80],
  'Noussair Mazraoui':  [75, 62, 84, 86, 80, 80],
  'Patrick Dorgu':      [74, 66, 80, 88, 86, 78],
  'Mathys Tel':         [72, 82, 56, 84, 91, 74],
  'Leny Yoro':          [68, 44, 90, 84, 82, 84],
  'Joshua Zirkzee':     [80, 74, 46, 78, 76, 85],
  'Luke Shaw':          [74, 56, 82, 82, 76, 80],
  'Casemiro':           [80, 54, 88, 82, 70, 88],
  'Amad Diallo':        [70, 74, 54, 84, 88, 72],
  'Mason Mount':        [80, 60, 64, 72, 74, 82],
  'Tyrell Malacia':     [70, 50, 78, 80, 78, 74],
  'Altay Bayindir':     [68, 20, 84, 76, 60, 72],
};
const RADAR_LABELS = ['\ud328\uc2f1', '\uc288\ud305', '\uc218\ube44', '\uccb4\ub825', '\uc2a4\ud53c\ub4dc', '\uc804\uc220'];
const RADAR_AVG = [72, 68, 72, 78, 74, 74];

const playerDummyStats: Record<string, any> = {
  'Bruno Fernandes':    { apps: 35, goals: 14, assists: 10, rating: '7.82', minutes: 2968, shots: 98, shotsOn: 52, passes: 1820, passKey: 88, passAcc: 84, tackles: 28, interceptions: 18, duels: 285, duelsWon: 152, dribbles: 65, dribblesWon: 38, yellows: 6 },
  'Kobbie Mainoo':      { apps: 30, goals: 3,  assists: 5,  rating: '7.54', minutes: 2456, shots: 42, shotsOn: 18, passes: 1640, passKey: 46, passAcc: 88, tackles: 62, interceptions: 35, duels: 310, duelsWon: 178, dribbles: 55, dribblesWon: 34, yellows: 5 },
  'Manuel Ugarte':      { apps: 28, goals: 0,  assists: 2,  rating: '7.38', minutes: 2180, shots: 14, shotsOn: 5,  passes: 1520, passKey: 22, passAcc: 86, tackles: 85, interceptions: 52, duels: 380, duelsWon: 220, dribbles: 35, dribblesWon: 20, yellows: 8 },
  'Diogo Dalot':        { apps: 32, goals: 3,  assists: 6,  rating: '7.22', minutes: 2640, shots: 35, shotsOn: 15, passes: 1680, passKey: 52, passAcc: 80, tackles: 55, interceptions: 38, duels: 290, duelsWon: 155, dribbles: 72, dribblesWon: 44, yellows: 4 },
  'Lisandro Martinez':  { apps: 24, goals: 0,  assists: 1,  rating: '7.44', minutes: 1980, shots: 12, shotsOn: 4,  passes: 1420, passKey: 18, passAcc: 88, tackles: 58, interceptions: 42, duels: 265, duelsWon: 158, dribbles: 22, dribblesWon: 14, yellows: 5 },
  'Harry Maguire':      { apps: 22, goals: 2,  assists: 0,  rating: '7.02', minutes: 1742, shots: 18, shotsOn: 8,  passes: 1180, passKey: 12, passAcc: 86, tackles: 42, interceptions: 28, duels: 210, duelsWon: 118, dribbles: 12, dribblesWon: 6,  yellows: 4 },
  'Alejandro Garnacho': { apps: 33, goals: 13, assists: 7,  rating: '7.64', minutes: 2520, shots: 88, shotsOn: 42, passes: 880,  passKey: 56, passAcc: 72, tackles: 18, interceptions: 12, duels: 240, duelsWon: 128, dribbles: 120,dribblesWon: 68, yellows: 3 },
  'Rasmus Hojlund':     { apps: 28, goals: 16, assists: 4,  rating: '7.28', minutes: 2150, shots: 95, shotsOn: 48, passes: 520,  passKey: 28, passAcc: 68, tackles: 12, interceptions: 8,  duels: 195, duelsWon: 95,  dribbles: 55, dribblesWon: 28, yellows: 2 },
  'Andre Onana':        { apps: 34, goals: 0,  assists: 0,  rating: '7.15', minutes: 3060, shots: 0,  shotsOn: 0,  passes: 820,  passKey: 4,  passAcc: 72, tackles: 4,  interceptions: 2,  duels: 22,  duelsWon: 12,  dribbles: 4,  dribblesWon: 2,  yellows: 2 },
  'Casemiro':           { apps: 20, goals: 1,  assists: 1,  rating: '6.82', minutes: 1540, shots: 18, shotsOn: 6,  passes: 1220, passKey: 24, passAcc: 84, tackles: 55, interceptions: 38, duels: 255, duelsWon: 148, dribbles: 28, dribblesWon: 14, yellows: 7 },
  'Luke Shaw':          { apps: 14, goals: 0,  assists: 3,  rating: '7.18', minutes: 980,  shots: 8,  shotsOn: 3,  passes: 820,  passKey: 28, passAcc: 82, tackles: 28, interceptions: 20, duels: 142, duelsWon: 82,  dribbles: 30, dribblesWon: 18, yellows: 2 },
  'Patrick Dorgu':      { apps: 26, goals: 2,  assists: 5,  rating: '7.12', minutes: 1980, shots: 28, shotsOn: 12, passes: 1140, passKey: 42, passAcc: 76, tackles: 48, interceptions: 32, duels: 248, duelsWon: 132, dribbles: 68, dribblesWon: 38, yellows: 4 },
  'Leny Yoro':          { apps: 18, goals: 0,  assists: 0,  rating: '7.35', minutes: 1380, shots: 8,  shotsOn: 2,  passes: 1020, passKey: 10, passAcc: 88, tackles: 45, interceptions: 32, duels: 185, duelsWon: 108, dribbles: 15, dribblesWon: 9,  yellows: 3 },
  'Noussair Mazraoui':  { apps: 25, goals: 1,  assists: 4,  rating: '7.20', minutes: 1920, shots: 18, shotsOn: 7,  passes: 1280, passKey: 38, passAcc: 80, tackles: 50, interceptions: 32, duels: 235, duelsWon: 130, dribbles: 55, dribblesWon: 32, yellows: 3 },
  'Amad Diallo':        { apps: 22, goals: 6,  assists: 4,  rating: '7.32', minutes: 1520, shots: 52, shotsOn: 24, passes: 720,  passKey: 38, passAcc: 74, tackles: 14, interceptions: 10, duels: 185, duelsWon: 96,  dribbles: 85, dribblesWon: 48, yellows: 2 },
  'Joshua Zirkzee':     { apps: 24, goals: 7,  assists: 4,  rating: '7.08', minutes: 1680, shots: 65, shotsOn: 28, passes: 680,  passKey: 42, passAcc: 76, tackles: 10, interceptions: 6,  duels: 165, duelsWon: 78,  dribbles: 48, dribblesWon: 28, yellows: 2 },
  'Altay Bayindir':     { apps: 8,  goals: 0,  assists: 0,  rating: '7.08', minutes: 720,  shots: 0,  shotsOn: 0,  passes: 280,  passKey: 2,  passAcc: 70, tackles: 2,  interceptions: 0,  duels: 8,   duelsWon: 4,   dribbles: 2,  dribblesWon: 1,  yellows: 1 },
  'Tyrell Malacia':     { apps: 16, goals: 0,  assists: 2,  rating: '6.98', minutes: 1080, shots: 6,  shotsOn: 2,  passes: 720,  passKey: 22, passAcc: 78, tackles: 38, interceptions: 24, duels: 168, duelsWon: 92,  dribbles: 35, dribblesWon: 20, yellows: 3 },
  'Mason Mount':        { apps: 12, goals: 1,  assists: 2,  rating: '6.72', minutes: 680,  shots: 22, shotsOn: 8,  passes: 620,  passKey: 28, passAcc: 80, tackles: 18, interceptions: 12, duels: 115, duelsWon: 58,  dribbles: 32, dribblesWon: 18, yellows: 2 },
  'Mathys Tel':         { apps: 18, goals: 8,  assists: 4,  rating: '7.18', minutes: 1240, shots: 58, shotsOn: 28, passes: 640,  passKey: 42, passAcc: 74, tackles: 16, interceptions: 10, duels: 185, duelsWon: 96,  dribbles: 88, dribblesWon: 52, yellows: 2 },
  'Marcus Rashford':    { apps: 28, goals: 10, assists: 5,  rating: '7.20', minutes: 2080, shots: 75, shotsOn: 35, passes: 760,  passKey: 48, passAcc: 72, tackles: 15, interceptions: 10, duels: 210, duelsWon: 112, dribbles: 98, dribblesWon: 56, yellows: 3 },
};

// 스탯 비교 행 목록
const COMPARE_ROWS: { key: keyof typeof playerDummyStats[string]; label: string; higherIsBetter: boolean }[] = [
  { key: 'apps',          label: '출전',          higherIsBetter: true  },
  { key: 'minutes',       label: '출전 시간(분)',   higherIsBetter: true  },
  { key: 'goals',         label: '골',            higherIsBetter: true  },
  { key: 'assists',       label: '어시스트',        higherIsBetter: true  },
  { key: 'rating',        label: '평점',           higherIsBetter: true  },
  { key: 'shots',         label: '슈팅',           higherIsBetter: true  },
  { key: 'shotsOn',       label: '유효슈팅',        higherIsBetter: true  },
  { key: 'passes',        label: '패스',           higherIsBetter: true  },
  { key: 'passKey',       label: '키패스',          higherIsBetter: true  },
  { key: 'passAcc',       label: '패스 정확도(%)',  higherIsBetter: true  },
  { key: 'tackles',       label: '태클',           higherIsBetter: true  },
  { key: 'interceptions', label: '인터셉트',        higherIsBetter: true  },
  { key: 'duels',         label: '듀얼',           higherIsBetter: true  },
  { key: 'duelsWon',      label: '듀얼 성공',       higherIsBetter: true  },
  { key: 'dribbles',      label: '드리블 시도',     higherIsBetter: true  },
  { key: 'dribblesWon',   label: '드리블 성공',     higherIsBetter: true  },
  { key: 'yellows',       label: '경고',           higherIsBetter: false },
];

interface SquadPlayer {
  playerId: number;
  name: string;
  position?: string;
  photo?: string;
  shirtNumber?: number;
}

// ── 이중 레이더 차트 ─────────────────────────────────────────────────────────
const DualRadarChart: React.FC<{ nameA: string; nameB: string }> = ({ nameA, nameB }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataA = playerRadarData[nameA] ?? RADAR_AVG;
  const dataB = playerRadarData[nameB] ?? RADAR_AVG;
  const N = RADAR_LABELS.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2 - 10;
    const maxR = Math.min(W, H) * 0.34;

    ctx.clearRect(0, 0, W, H);
    const angle = (i: number) => (Math.PI / 2) * 3 + (2 * Math.PI * i) / N;
    const pt = (i: number, r: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });

    // 그리드
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const p = pt(i, r);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring === 5 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    // 축
    for (let i = 0; i < N; i++) {
      const p = pt(i, maxR);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.7; ctx.stroke();
    }

    const drawPolygon = (data: number[], fill: string, stroke: string) => {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const r = (data[i] / 100) * maxR;
        const p = pt(i, r);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
    };

    // A (빨강)
    drawPolygon(dataA, 'rgba(239,68,68,0.18)', 'rgba(239,68,68,0.9)');
    // B (파랑)
    drawPolygon(dataB, 'rgba(59,130,246,0.18)', 'rgba(59,130,246,0.9)');

    // 라벨
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < N; i++) {
      const p = pt(i, maxR + 18);
      ctx.fillStyle = 'rgba(200,200,200,0.85)';
      ctx.fillText(RADAR_LABELS[i], p.x, p.y + 4);
    }

    // 수치 점
    const drawDots = (data: number[], color: string) => {
      for (let i = 0; i < N; i++) {
        const r = (data[i] / 100) * maxR;
        const p = pt(i, r);
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      }
    };
    drawDots(dataA, '#ef4444');
    drawDots(dataB, '#3b82f6');
  }, [nameA, nameB]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={280}
      className="mx-auto block"
    />
  );
};

// ── 선수 선택 드롭다운 ───────────────────────────────────────────────────────
const PlayerSelector = ({
  squad,
  selected,
  color,
  onSelect,
}: {
  squad: SquadPlayer[];
  selected: SquadPlayer | null;
  color: 'red' | 'blue';
  onSelect: (p: SquadPlayer | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = squad.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (playerNameKoMap[canonicalOf(p)] ?? '').includes(q)
  );
  const ringClass = color === 'red' ? 'ring-red-600' : 'ring-blue-600';
  const bgClass   = color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); setQ(''); }}
        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-[#2a2a2a] ring-2 ${ringClass} transition-all`}
      >
        {selected ? (
          <>
            {selected.photo ? (
              <img src={selected.photo} alt={selected.name} className="w-12 h-12 rounded-full object-cover bg-[#333]" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#444] flex items-center justify-center text-gray-500 text-xl">👤</div>
            )}
            <div className="flex-1 text-left">
              <div className="text-white font-semibold text-sm">
                {playerNameKoMap[canonicalOf(selected)] ?? selected.name}
              </div>
              <div className="text-xs text-gray-400">{selected.name}</div>
            </div>
            <span className="text-gray-500 text-xs">▼</span>
          </>
        ) : (
          <div className={`flex-1 text-center py-2 rounded-lg ${bgClass} text-white text-sm font-medium`}>
            선수 선택
          </div>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#2a2a2a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <input
              autoFocus
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="이름 검색..."
              className="w-full bg-[#333] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-800">
            {filtered.map(p => (
              <button
                key={p.playerId}
                onClick={() => { onSelect(p); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left"
              >
                {p.photo ? (
                  <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover bg-[#444]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#444] flex items-center justify-center text-gray-500">👤</div>
                )}
                <div>
                  <div className="text-white text-sm">{playerNameKoMap[canonicalOf(p)] ?? p.name}</div>
                  <div className="text-gray-500 text-xs">{p.name}</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-sm">검색 결과 없음</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function canonicalOf(p: SquadPlayer): string {
  return (p.playerId && playerIdToFullName[p.playerId])
    ?? abbreviatedToFullName[p.name]
    ?? p.name;
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function PlayerComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [playerA, setPlayerA] = useState<SquadPlayer | null>(null);
  const [playerB, setPlayerB] = useState<SquadPlayer | null>(null);

  useEffect(() => {
    axios.get('/api/squad').then(r => {
      const list: SquadPlayer[] = r.data?.squad ?? [];
      setSquad(list);
      // URL 파라미터로 초기 선수 지정
      const pidA = parseInt(searchParams.get('a') ?? '');
      const pidB = parseInt(searchParams.get('b') ?? '');
      if (pidA) setPlayerA(list.find(p => p.playerId === pidA) ?? null);
      if (pidB) setPlayerB(list.find(p => p.playerId === pidB) ?? null);
    }).catch(() => {});
  }, []);

  const nameA = playerA ? canonicalOf(playerA) : null;
  const nameB = playerB ? canonicalOf(playerB) : null;
  const statsA = nameA ? playerDummyStats[nameA] : null;
  const statsB = nameB ? playerDummyStats[nameB] : null;
  const radarA = nameA ? playerRadarData[nameA] ?? RADAR_AVG : null;
  const radarB = nameB ? playerRadarData[nameB] ?? RADAR_AVG : null;

  const positionKoMap: Record<string, string> = {
    Goalkeeper: '\uace8\ud0a4\ud37c', Defender: '\uc218\ube44\uc218',
    Midfielder: '\ubbf8\ub4dc\ud544\ub354', Attacker: '\uacf5\uaca9\uc218', Forward: '\uacf5\uaca9\uc218',
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pb-16">
      {/* 헤더 */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm transition-colors">
            ←
          </button>
          <h1 className="text-sm font-semibold text-gray-200">선수 비교</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">

        {/* 선수 선택 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-red-400 font-bold mb-1.5 text-center">선수 A</p>
            <PlayerSelector squad={squad} selected={playerA} color="red" onSelect={setPlayerA} />
          </div>
          <div>
            <p className="text-xs text-blue-400 font-bold mb-1.5 text-center">선수 B</p>
            <PlayerSelector squad={squad} selected={playerB} color="blue" onSelect={setPlayerB} />
          </div>
        </div>

        {/* 비교 본문 */}
        {playerA && playerB && nameA && nameB ? (
          <>
            {/* 레이더 차트 */}
            <div className="bg-[#272727] rounded-2xl p-5">
              <h2 className="text-white font-semibold text-sm mb-3 text-center">능력치 레이더 비교</h2>
              <div className="flex items-center justify-center gap-6 mb-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-1 bg-red-500 rounded" />
                  <span className="text-gray-300">{playerNameKoMap[nameA] ?? nameA}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-1 bg-blue-500 rounded" />
                  <span className="text-gray-300">{playerNameKoMap[nameB] ?? nameB}</span>
                </span>
              </div>
              <DualRadarChart nameA={nameA} nameB={nameB} />

              {/* 레이더 수치 그리드 */}
              <div className="mt-3 grid grid-cols-6 gap-1.5">
                {RADAR_LABELS.map((label, i) => {
                  const vA = (radarA ?? RADAR_AVG)[i];
                  const vB = (radarB ?? RADAR_AVG)[i];
                  return (
                    <div key={label} className="bg-[#333] rounded-lg p-1.5 text-center">
                      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
                      <div className={`text-xs font-bold ${vA > vB ? 'text-red-400' : vA < vB ? 'text-gray-400' : 'text-gray-400'}`}>{vA}</div>
                      <div className="h-px bg-gray-600 my-1" />
                      <div className={`text-xs font-bold ${vB > vA ? 'text-blue-400' : vB < vA ? 'text-gray-400' : 'text-gray-400'}`}>{vB}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 스탯 비교 테이블 */}
            <div className="bg-[#272727] rounded-2xl overflow-hidden">
              {/* 헤더 */}
              <div className="grid grid-cols-3 px-4 py-3 border-b border-[#333] text-xs font-bold">
                <div className="text-red-400 text-center">{playerNameKoMap[nameA] ?? nameA}</div>
                <div className="text-gray-500 text-center">항목</div>
                <div className="text-blue-400 text-center">{playerNameKoMap[nameB] ?? nameB}</div>
              </div>

              <div className="divide-y divide-[#333]">
                {COMPARE_ROWS.map(({ key, label, higherIsBetter }) => {
                  const vA = statsA ? Number(statsA[key] ?? 0) : null;
                  const vB = statsB ? Number(statsB[key] ?? 0) : null;
                  if (vA === null && vB === null) return null;

                  const aIsWinner = vA !== null && vB !== null && (higherIsBetter ? vA > vB : vA < vB);
                  const bIsWinner = vA !== null && vB !== null && (higherIsBetter ? vB > vA : vB < vA);

                  const maxVal = Math.max(vA ?? 0, vB ?? 0, 1);

                  return (
                    <div key={key} className="px-4 py-2.5">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className={`w-20 text-right font-bold tabular-nums ${aIsWinner ? 'text-red-300' : 'text-gray-300'}`}>
                          {vA !== null ? (key === 'rating' ? Number(vA).toFixed(2) : vA.toLocaleString()) : '-'}
                        </span>
                        <span className="text-gray-500 text-xs text-center w-28">{label}</span>
                        <span className={`w-20 text-left font-bold tabular-nums ${bIsWinner ? 'text-blue-300' : 'text-gray-300'}`}>
                          {vB !== null ? (key === 'rating' ? Number(vB).toFixed(2) : vB.toLocaleString()) : '-'}
                        </span>
                      </div>
                      {/* 시각화 바 */}
                      {key !== 'rating' && (
                        <div className="flex items-center gap-1 h-1.5">
                          <div className="flex-1 flex justify-end">
                            <div
                              className={`h-full rounded-full ${aIsWinner ? 'bg-red-500' : 'bg-gray-600'}`}
                              style={{ width: `${((vA ?? 0) / maxVal) * 100}%` }}
                            />
                          </div>
                          <div className="w-px h-2.5 bg-gray-600 shrink-0" />
                          <div className="flex-1 flex justify-start">
                            <div
                              className={`h-full rounded-full ${bIsWinner ? 'bg-blue-500' : 'bg-gray-600'}`}
                              style={{ width: `${((vB ?? 0) / maxVal) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 선수 상세 페이지 링크 */}
            <div className="grid grid-cols-2 gap-3">
              {[{ player: playerA, name: nameA, color: 'red' }, { player: playerB, name: nameB, color: 'blue' }].map(({ player, name, color }) => (
                <button
                  key={player.playerId}
                  onClick={() => navigate(`/squad/${player.playerId}`)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                    color === 'red'
                      ? 'border-red-800/60 bg-red-950/20 text-red-300 hover:bg-red-900/30'
                      : 'border-blue-800/60 bg-blue-950/20 text-blue-300 hover:bg-blue-900/30'
                  }`}
                >
                  {playerNameKoMap[name] ?? name} 상세 →
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <div className="text-4xl mb-3">⚖️</div>
            <p className="text-sm">위에서 비교할 선수 두 명을 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
