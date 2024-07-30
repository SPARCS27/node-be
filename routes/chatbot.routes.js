import express from "express";
import axios from "axios";
import { fileURLToPath } from "url";

import fs from "fs";
import path from "path";

const router = express.Router();

const CLOVA_STUDIO_URL =
    "https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions/HCX-DASH-001";
const CLOVASTUDIO_API_KEY =
    "NTA0MjU2MWZlZTcxNDJiYyFQr4dAhynWLMW3vjlm5E87FnDzsW6j/n4vlCRh5LX6";
const APIGW_API_KEY = "g7W7hqnvpY0L5nE3fCnunbdoZzCIZyHlEEkVSh5l";
const CLOVASTUDIO_REQUEST_ID = "2f86f566-6114-4bbc-9753-e1a7942d4aca";

const headers = {
    "X-NCP-CLOVASTUDIO-API-KEY": CLOVASTUDIO_API_KEY,
    "X-NCP-APIGW-API-KEY": APIGW_API_KEY,
    "X-NCP-CLOVASTUDIO-REQUEST-ID": CLOVASTUDIO_REQUEST_ID,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
};

const readPrompt = () => {
    const filePath = path.join(process.cwd(), "guide", "v1.md");
    return fs.readFileSync(filePath, "utf8");
};

const systemPrompt = {
    role: "system",
    content: readPrompt(),
};

const clovaOption = {
    topP: 0.5,
    topK: 10,
    maxTokens: 256,
    temperature: 0.1,
    repeatPenalty: 1.0,
    stopBefore: [],
    includeAiFilters: true,
    seed: 0,
};

router.post("/chat", async (req, res) => {
    const { turn, history } = req.body;

    if (history.length === 0) {
        history.push(systemPrompt);
    }
    history.push(turn);

    try {
        const response = await getClovaMessage({
            messages: history,
            ...clovaOption,
        });
        console.log(response);
        history.push(response);
        res.status(200).json({
            result: true,
            message: response,
            history: history,
        });
    } catch (error) {
        res.status(500).json({ result: false, error: error.message });
    }
});

const getClovaMessage = async (data) => {
    const response = await axios
        .post(CLOVA_STUDIO_URL, JSON.stringify(data), {
            headers: headers,
        })
        .then((res) => res.data);
    const chunks = response.split("\n\n");
    for (const chunk of chunks) {
        if (chunk.includes("event:token")) {
            continue;
        }
        const regex = /data:({\s*".*})/;
        const match = chunk.match(regex);

        if (!match) {
            continue;
        }
        return JSON.parse(match[1]).message;
    }
    return "";
};

export default router;
