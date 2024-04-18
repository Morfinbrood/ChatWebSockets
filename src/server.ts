import express from "express";
import WebSocket from "ws";
import { MessageService } from "./services/messageService";

const app = express();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const wss = new WebSocket.Server({ server });

const messageService = MessageService.getInstance(wss);

wss.on("connection", (ws: WebSocket) => {
  let groupId: string;

  ws.on("message", (data: string) => {
    const message = JSON.parse(data.toString());
    if (message.type === "join") {
      groupId = message.groupId;
      messageService.joinGroup(groupId, ws);
    } else if (message.type === "message") {
      if (groupId) {
        messageService.sendMessage(groupId, message.text, ws);
      }
    }
  });

  ws.on("close", () => {
    if (groupId) {
      messageService.leaveGroup(groupId, ws);
    }
  });
});
