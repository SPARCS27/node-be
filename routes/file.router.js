import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

router.get("/file/download/:fileName", async (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(process.cwd(), "storage", fileName);

    try {
        if (!fs.existsSync(filePath)) {
            return res
                .status(404)
                .json({ result: false, message: "File not found" });
        }

        res.download(filePath, fileName, (err) => {
            if (err) {
                res.status(500).json({
                    result: false,
                    message: "Failed to download file",
                });
            }
        });
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
});

export default router;
