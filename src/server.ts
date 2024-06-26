import express from "express";
import http from "http";
import WebSocket from "ws";
import { MessageService } from "./services/messageService";
import cors from "cors";
import { upgradeMiddleware } from "./middleware/upgradeMiddleware";
import messageRoutes from "./routes/messageRoutes";

import { JoinMessage, RegularMessage } from "./types/types";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const messageService = MessageService.getInstance(wss);

wss.on("connection", (ws: WebSocket) => {
  console.log(` server.ts: new connection init`);
  ws.on("message", (messageData: JoinMessage | RegularMessage) => {
    console.log(`server.ts: ws.on("message") messageData: ${messageData}`);
    messageService.handleSocketMessage(ws, messageData);
  });
});

server.on("upgrade", upgradeMiddleware(wss));

app.use(messageRoutes(wss));

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
