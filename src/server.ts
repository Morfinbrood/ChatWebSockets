import express from "express";
import http from "http";
import WebSocket from "ws";
import { MessageService } from "./services/messageService";
import cors from "cors";

import { JoinMessage, RegularMessage } from "./types";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const messageService = MessageService.getInstance(wss);

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (messageData: JoinMessage | RegularMessage) => {
    messageService.handleSocketMessage(ws, messageData);
  });
});

app.post("/sendHTTPMessage", (req, res) => {
  messageService.handleHTTPMessage(req, res);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
