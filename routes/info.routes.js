import express from "express";

const router = express.Router();

const db = {
    SMC: {
        name: "상하이 맥스파이시 치킨 버거",
        price: 7000,
        upgradeable: true,
        upgradeCost: 2000,
    },
    BTD: {
        name: "베이컨 토마토 디럭스 버스",
        price: 6000,
        upgradeable: true,
        upgradeCost: 1900,
    },
};

router.get("/info/:code", async (req, res) => {
    const code = req.params.code;
    console.log(code);

    try {
        const data = db[code];
        res.status(200).json({ result: true, data });
    } catch {
        res.status(400).json({ result: false });
    }
});

export default router;
