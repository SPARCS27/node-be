import express from "express";
import { v4 } from "uuid";
import path from "path";
import fs from "fs/promises";

import querystring from "querystring";
import axios from "axios";

const router = express.Router();

const invoke_url = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts";
const CLIENT_ID = process.env.VOICE_CLIENT_ID;
const CLIENT_SECRET = process.env.VOICE_CLIENT_SECRET;
const SERVER_HOST = process.env.SERVER_HOST || "http://localhost:4000";

console.log("VOICE_CLIENT_ID:", process.env.VOICE_CLIENT_ID);
console.log("VOICE_CLIENT_SECRET:", process.env.VOICE_CLIENT_SECRET);

const data = {
    speaker: "nes_c_hyeri",
    text: "네, 총 6,900원입니다. 앞쪽에 카드 넣어주세요",
    volume: 0,
    speed: 0,
    pitch: 1,
};

router.post("/tts", async (req, res) => {
    const { text } = req.body;
    try {
        data.text = text;
        const filePath = await TTS(data);
        const link = `${SERVER_HOST}/file/download/${filePath}`;
        res.status(200).json({ result: true, filePath, link });
    } catch (error) {
        console.error("Error in TTS route:", error);
        res.status(500).json({ result: false, error: error.message });
    }
});

const TTS = async (data) => {
    try {
        const response = await axios.post(
            invoke_url,
            querystring.stringify(data),
            {
                headers: {
                    "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
                    "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                responseType: "arraybuffer",
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        const fileName = `${v4()}.mp3`;
        const filePath = path.join(process.cwd(), "storage", fileName);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, response.data);

        console.log("MP3 파일이 저장되었습니다:", filePath);
        return fileName;
    } catch (error) {
        console.error("Error making request:", error);
        throw error;
    }
};

export default router;
