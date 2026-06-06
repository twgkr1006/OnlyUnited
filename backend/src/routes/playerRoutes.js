const express = require("express");
const { prisma } = require("../prisma");
const { syncManUtdSquadToDB } = require("../service/playerService");

const router = express.Router();

// 동기화 트리거
router.post("/manutd/sync", async (req, res, next) => {
    try {
        const count = await syncManUtdSquadToDB();
        res.json({ ok: true, synced: count });
    } catch (e) {
        next(e);
    }
});

// 목록 조회 (간단 정렬)
router.get("/manutd", async (req, res, next) => {
    try {
        const players = await prisma.player.findMany({
            orderBy: [{ position: "asc" }, { name: "asc" }],
        });
        res.json({ players });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
