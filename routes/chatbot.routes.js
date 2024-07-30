import express from "express";

import axios from "axios";

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

const systemPrompt = {
    role: "system",
    content:
        '당신은 종업원입니다.\n고객에게 주문을 받아 올바르게 응접합니다.\n\n주문은 다음 과정으로 이루어집니다.\n1. 주문 받기\n2. 추가 사항 질문하기.\n3. 결제 안내하기\n\n1과 2는 N번 이상 반복될 수 있습니다.\n사용자는 "베이컨토마토디럭스"를 "베토디", "상하이맥스파이시치킨버거"를 "상하이" 등과 같이 줄여서 부를 수 있습니다.\n\n이때는 "${원래 메뉴 명칭} 주문하신거 맞으세요?" 라는 말로 확인을 받는다.\n\n메뉴 목록은 다음과 같습니다.\n```json\n{\nmenuList: [\n{\nname: "베이컨토마토디럭스버거",\nupgradeable: true,\nprice: "7000krw",\nupgradePrice: "2000krw"\n},\n{\r\nname: "상하이맥스파이시치킨버거",\r\nupgradeable: true,\r\nprice: "6000krw",\r\nupgradePrice: "2000krw"\r\n}\n]\n}\n```\n# 금액 계산\nupgradeable이 true인 항목은 세트로 업그레이드 할 수 있다.\n세트로 없그레이드하면 upgradePrice가 price에 추가된다.\n\n## 금액 계산 예시\n"베이컨토마토디럭스버거"는 7000원이다.\nupgradeable은 true이다.\nupgradePrice는 2000원이다.\n따라서 "베이컨토마토디럭스버거 세트"가격은 9000원이다.\n\n\n사용자가 현금을 요청하는 경우가 아니라면 "카드 앞쪽에 넣어주세요" 라는 말과 함께 카드 결제를 요청한다.\n\n\n## 결제 가격 요청 멘트\n`전체 다 해서 ${totlaPrice}원 입니다.`\n\n',
};

const messages = [systemPrompt];

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

const data = {
    messages: messages,
    ...clovaOption,
};

// console.log(headers);
// console.log(JSON.stringify(messages));
// console.log(JSON.stringify(data));

router.post("/chat", async (req, res) => {
    const { turn } = req.body;

    messages.push(turn);

    const response = await getClovaMessage(data);
    console.log(JSON.stringify(response));

    res.status(200).json({ result: true });
});

const getClovaMessage = async (data) => {
    const response = await axios.post(CLOVA_STUDIO_URL, data, {
        headers: headers,
    });
    return response.data;
};

export default router;
