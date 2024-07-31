import express from "express";
import {
    extractOrderTask,
    fetchETC,
    fetchOrderConversation,
    recommendMenu,
} from "../services/clova.service.js";
import { getClassfy } from "../services/clova.class.service.js";

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

// const isRecommendRes = (turn) => {
//     if (turn.content.includes("추천")) {
//         if (
//             turn.content.includes("메뉴") ||
//             turn.content.includes("버거") ||
//             turn.content.includes("음식") ||
//             turn.content.includes("것") ||
//             turn.content.includes("거")
//         ) {
//             return true;
//         }
//     }
//     return false;
// };

router.post("/chat", async (req, res) => {
    const { turn, history } = req.body;

    history.push(turn);

    try {
        const classfy = await getClassfy({
            messages: history,
            ...clovaOption,
        });
        console.log(classfy.class);

    } catch(error) {
        
    }

    if (classfy.class === "REC") {
        try {
            const response = await recommendMenu({
                messages: history,
                ...clovaOption,
            });

            const assistantMessage = {
                role: "assistant",
                content: response.comment,
            };
            history.push(assistantMessage);

            response.menu.link = `https://api.sparcs27.jeongrae.me/file/download/${response.menu.code}.png`;

            return res.status(200).json({
                result: true,
                message: assistantMessage,
                history: history,
                recommend: response,
            });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ result: false, error: error.message });
        }
    } else if (classfy.class === "OTH") {
        try {
            const etcConversation = await fetchETC({
                messages: history,
                ...clovaOption,
            });
            // history.push(etcConversation);

            history.forEach((message) => {
                message.content = replaceLF(message.content);
            });
            res.status(200).json({
                result: true,
                message: etcConversation,
                history: history,
            });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ result: false, error: error.message });
        }
    } else if (classfy.class === "ORD") {
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

            if (clovaConversation.content.includes("결제 도와드리겠습니다")) {
                cart.task.step = "PAY";
                const price = cart.task.totalPrice;
                // console.log(price);
                const insertedPriceText = insertPrice(
                    clovaConversation.content,
                    price
                );
                // console.log(insertedPriceText);
                clovaConversation.content = insertedPriceText;
                history.at(-1).content = insertedPriceText;
            }

            return res.status(200).json({
                result: true,
                message: clovaConversation,
                history: history,
                cart: cart,
            });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ result: false, error: error.message });
        }
    } else {
        res.status(200).json({ result: false });
    }
    return;
});

const replaceLF = (content) => {
    return content.replace(/\r\n\r\n/g, " ");
};

const insertPrice = (text, price) => {
    return text.replace(/(결제 도와드리겠습니다)/, `${price}원 $1`);
};

export default router;
