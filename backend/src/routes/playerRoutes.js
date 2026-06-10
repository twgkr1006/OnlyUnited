const express = require("express");
const prisma = require("../prisma");
const { syncManUtdSquadToDB } = require("../service/playerService");

const router = express.Router();

// GET /api/squad - 프론트엔드 SquadPage에서 호출
router.get("/", async (req, res, next) => {
    try {
        const players = await prisma.player.findMany({
            orderBy: [{ position: "asc" }, { name: "asc" }],
        });
        res.json({ squad: players });
    } catch (e) {
        next(e);
    }
});

// POST /api/squad/sync - 수동 동기화 트리거
router.post("/sync", async (req, res, next) => {
    try {
        const count = await syncManUtdSquadToDB();
        res.json({ ok: true, synced: count });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
