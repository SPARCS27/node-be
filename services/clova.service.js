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

const conversationGuide = prompt("conversation", "v5");
const orderGuide = prompt("order", "v3");
const recommendGuide = prompt("recommend", "v1");
const etcGuide = prompt("etc", "v1");

console.log("#####PROMPT#####");
// console.log(conversationGuide);
// console.log(orderGuide);
console.log("#####PROMPT#####");

// 주문
export const fetchOrderConversation = async (data) => {
    data.messages = [
        { role: "system", content: conversationGuide },
        ...data.messages,
    ];

    const response = await axios
        .post(CLOVA_STUDIO_URL, JSON.stringify(data), {
            headers: headers,
        })
        .then((res) => res.data);
    const chunks = response.split("\n\n");

    return extractEventResult(chunks);
};

// 추천
export const recommendMenu = async (data) => {
    data.messages = [
        { role: "system", content: recommendGuide },
        ...data.messages,
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

    // console.log(extractEventResult(chunks).content);

    const recommendation = JSON.parse(extractEventResult(chunks).content);
    console.log(recommendMenu);
    return recommendation;
};

// task 관리
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
        console.error(error);
        return {};
    }
};

//기타질문
export const fetchETC = async (data) => {
    data.messages = [{ role: "system", content: etcGuide }, ...data.messages];

    // console.log(data);
    const response = await axios
        .post(
            "https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions/HCX-DASH-001",
            JSON.stringify(data),
            {
                headers: {
                    ...headers,
                    CLOVASTUDIO_REQUEST_ID:
                        "f1b5e7f7-a793-4f1a-9ae6-94219cf9a146",
                },
            }
        )
        .then((res) => res.data);
    const chunks = response.split("\n\n");

    const result = extractEventResult(chunks);
    // console.log(result);
    return result;
};

// 이벤트 result 추출
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

        console.log(match[1]);
        match[1] = removeJsonMarkers(match[1]);
        return JSON.parse(match[1]).message;
    }

    return "";
};

// JSON 리무브
const removeJsonMarkers = (input) => {
    // 입력이 문자열이 아니면 JSON으로 변환
    const str = typeof input === "string" ? input : JSON.stringify(input);

    const processString = (s) => {
        return s.replace(/```json\n?([\s\S]*?)```/g, (_, p1) => {
            try {
                // JSON 파싱 시도
                const parsed = JSON.parse(p1);
                return JSON.stringify(parsed);
            } catch (e) {
                // 파싱 실패 시 원본 반환
                console.warn("Failed to parse JSON:", p1);
                return p1;
            }
        });
    };

    const processObject = (obj) => {
        if (typeof obj === "string") {
            return processString(obj);
        } else if (Array.isArray(obj)) {
            return obj.map(processObject);
        } else if (typeof obj === "object" && obj !== null) {
            const newObj = {};
            for (const [key, value] of Object.entries(obj)) {
                newObj[key] = processObject(value);
            }
            return newObj;
        }
        return obj;
    };

    try {
        const parsed = JSON.parse(str);
        const processed = processObject(parsed);
        return JSON.stringify(processed);
    } catch (e) {
        console.warn("Failed to parse outer JSON, processing as string");
        return processString(str);
    }
};
