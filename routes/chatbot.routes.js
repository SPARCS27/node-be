import express from "express";
import {
    extractOrderTask,
    fetchOrderConversation,
} from "../services/clova.service.js";

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

const clovaOption = {
    topP: 0.5,
    topK: 10,
    maxTokens: 256,
    temperature: 0.1,
    repeatPenalty: 1.0,
    stopBefore: [],
    includeAiFilters: false,
    seed: 0,
};

router.post("/chat", async (req, res) => {
    const { turn, history } = req.body;

    history.push(turn);

    try {
        const clovaConversation = await fetchOrderConversation({
            messages: history,
            ...clovaOption,
        });
        history.push(clovaConversation);

        history.forEach((message) => {
            message.content = replaceLF(message.content);
        });

        const cart = await extractOrderTask({
            messages: history,
            ...clovaOption,
        });

        cart.task.menus.forEach((menu) => {
            if (!menu.isCombo) {
                delete menu.drink;
                delete menu.size;
            }
        });

        res.status(200).json({
            result: true,
            message: clovaConversation,
            history: history,
            cart: cart,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ result: false, error: error.message });
    }
});

const replaceLF = (content) => {
    return content.replace(/\r\n\r\n/g, " ");
};

export default router;
