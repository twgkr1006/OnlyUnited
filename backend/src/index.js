require('dotenv').config();

const express = require('express');
const cors = require('cors');

const userRouter = require('./routes/user');
const matchRoutes = require('./routes/match');
const standingRouter = require('./routes/standing');
const newsRoute = require('./routes/news');
const squadRoutes = require('./routes/playerRoutes');
const playerStatsRoutes = require('./routes/playerStats');
const matchDetailRoutes = require('./routes/matchDetail');
const boardRoutes    = require('./routes/board');
const transferRoutes = require('./routes/transfer');

require('./jobs/matchSyncJob');
require('./jobs/standingSyncJob');
require('./jobs/newsSyncJob');
require('./jobs/playerSyncJob');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        // localhost 개발 환경
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        // Vercel 배포 도메인
        if (/\.vercel\.app$/.test(origin)) return callback(null, true);
        // 환경변수로 지정된 프론트엔드 도메인
        const allowed = process.env.FRONTEND_URL;
        if (allowed && origin === allowed) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());

app.use('/api/user', userRouter);
app.use('/api/scheduled-matches', matchRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/matches', matchDetailRoutes);
app.use('/api/standings', standingRouter);
app.use('/api/news', newsRoute);
app.use('/api/squad', squadRoutes);
app.use('/api/players', playerStatsRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/transfer', transferRoutes);

app.get('/', (req, res) => {
    res.send('server running!');
});

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
