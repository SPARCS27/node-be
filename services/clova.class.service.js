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

const classfyGuide = prompt("classfy", "v1");

export const getClassfy = async (data) => {
    data.messages = [
        { role: "system", content: classfyGuide },
        ...data.messages,
    ];

    const response = await axios
        .post(CLOVA_STUDIO_URL, JSON.stringify(data), {
            headers: {
                ...headers,
                CLOVASTUDIO_REQUEST_ID: "105f8e64-4349-4983-9f34-575d7fd25b03",
            },
        })
        .then((res) => res.data);
    const chunks = response.split("\n\n");

    const classfy = JSON.parse(extractEventResult(chunks).content);
    return classfy;
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

        return JSON.parse(match[1]).message;
    }

    return "";
};
