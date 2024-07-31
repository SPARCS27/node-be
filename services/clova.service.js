import axios from "axios";
import { prompt } from "../prompt.config.js";

const CLOVA_STUDIO_URL = process.env.CLOVA_STUDIO_URL;
const CLOVASTUDIO_API_KEY = process.env.CLOVASTUDIO_API_KEY;
const APIGW_API_KEY = process.env.APIGW_API_KEY;
const CLOVASTUDIO_REQUEST_ID = process.env.CLOVASTUDIO_REQUEST_ID;

const headers = {
    "X-NCP-CLOVASTUDIO-API-KEY": CLOVASTUDIO_API_KEY,
    "X-NCP-APIGW-API-KEY": APIGW_API_KEY,
    "X-NCP-CLOVASTUDIO-REQUEST-ID": CLOVASTUDIO_REQUEST_ID,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
};

const conversationGuide = prompt("conversation", "v4");
const orderGuide = prompt("order", "v3");

console.log("#####PROMPT#####");
console.log(conversationGuide);
console.log(orderGuide);
console.log("#####PROMPT#####");

export const fetchOrderConversation = async (data) => {
    data.messages = [
        { role: "system", content: conversationGuide },
        ...data.messages,
    ];

    // console.log(JSON.stringify(data, null, 2));

    const response = await axios
        .post(CLOVA_STUDIO_URL, JSON.stringify(data), {
            headers: headers,
        })
        .then((res) => res.data);
    const chunks = response.split("\n\n");

    return extractEventResult(chunks);
};

export const extractOrderTask = async (data) => {
    const messages = structuredClone(data.messages);
    messages.forEach((message) => {
        if (message.role === "user") {
            message.role = "주문고객";
            return;
        }
        if (message.role === "assistant") {
            message.role = "점원";
            return;
        }
    });

    data.messages = [
        { role: "system", content: orderGuide },
        { role: "user", content: JSON.stringify(messages) },
    ];

    const response = await axios
        .post(CLOVA_STUDIO_URL, JSON.stringify(data), {
            headers: {
                ...headers,
                CLOVASTUDIO_REQUEST_ID: "b12ebb27-7e5a-4c2e-b633-a4c4ad615b49",
            },
        })
        .then((res) => res.data);

    const chunks = response.split("\n\n");

    try {
        return JSON.parse(extractEventResult(chunks).content);
    } catch (error) {
        console.log(error);
        console.log(chunks);
    }
};

const extractEventResult = (chunks) => {
    for (const chunk of chunks) {
        if (chunk.includes("event:token")) {
            continue;
        }
        const regex = /data:({\s*".*})/;
        const match = chunk.match(regex);

        if (!match) {
            continue;
        }
        match[1] = removeJsonMarkers(match[1]);
        return JSON.parse(match[1]).message;
    }

    return "";
};

const removeJsonMarkers = (text) => {
    const pattern = /^\s*```json\s*([\s\S]*?)\s*```\s*$/m;
    const match = text.match(pattern);

    if (match) {
        return match[1].trim();
    } else {
        return text;
    }
};
