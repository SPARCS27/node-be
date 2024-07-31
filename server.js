import "./env.config.js";

import express from "express";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import voiceRouter from "./routes/voice.router.js";
import fileRouter from "./routes/file.router.js";
import chatbotRouter from "./routes/chatbot.routes.js";
import infoRouter from "./routes/info.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const corsConfig = {
    origin: ["http://localhost:4137", "http://localhost:4000"],
    credentials: true,
};

app.use(cors(corsConfig));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(voiceRouter);
app.use(fileRouter);
app.use(chatbotRouter);
app.use(infoRouter);

const PORT = 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
