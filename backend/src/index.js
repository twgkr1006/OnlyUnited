const express = require('express');
const userRouter = require('./routes/user')
const app = express();
const PORT = 3001;

app.use(express.json());

app.use('/api/user', userRouter);

app.get('/', (req, res) => {
    res.send('server running!');
});

app.listen(PORT, () => {
    console.log(`✅ Server http://localhost:${PORT} at Running ✅`);
});
