require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');

const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const emailRouter = require('./routes/email');
const matchRoutes = require('./routes/match');
const standingRouter = require('./routes/standing');
const newsRoute = require('./routes/news');
const playerRoutes = require("./routes/playerRoutes");

require('./jobs/matchSyncJob');
require('./jobs/standingSyncJob');
require('./jobs/newsSyncJob'); 
require('./jobs/playerSyncJob');

const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true 
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

// ✅ 라우터 등록
app.use('/api/user', userRouter);
app.use('/auth', authRouter);
app.use('/email', emailRouter);
app.use('/api/scheduled-matches', matchRoutes);
app.use('/api/standings', standingRouter);
app.use('/api/news', newsRoute);
app.use("/api/players", playerRoutes);

app.get('/', (req, res) => {
    res.send('server running!');
});

app.get('/login-success', (req, res) => {
    const user = req.user;
    if (user) {
        const { user_id, user_phone } = user;
        return res.redirect(`http://localhost:5173/login?user_id=${user_id}&phone=${user_phone}`);
    }
    res.redirect('http://localhost:5173');
});

app.listen(PORT, () => {
    console.log(`✅ Server http://localhost:${PORT} at Running ✅`);
});