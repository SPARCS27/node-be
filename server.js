import "./env.config.js";

import express from "express";
import { createServer } from "http";
import cors from "cors";

import voiceRouter from "./routes/voice.router.js";
import fileRouter from "./routes/file.router.js";
import chatbotRouter from "./routes/chatbot.routes.js";
import infoRouter from "./routes/info.routes.js";

const app = express();
const server = createServer(app);

const corsConfig = {
    origin: "http://localhost:4137",
    credentials: true,
};

app.use(cors(corsConfig));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(voiceRouter);
app.use(fileRouter);
app.use(chatbotRouter);

const PORT = 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
