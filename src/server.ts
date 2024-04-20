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
  let groupIds: string[];

  ws.on("message", (messageData: any) => {
    let message = JSON.parse(messageData.toString());

    if (message.type === "join") {
      const groupId = message.groupId;
      messageService.joinGroup(groupId, ws);
    } else if (message.type === "message") {
      groupIds = message.groupIds;
      if (groupIds) {
        const text = String(message.text);
        groupIds.forEach((groupId) =>
          messageService.sendMessage(groupId, text, ws)
        );
      }
    } else {
      console.log(`unknown message.type`);
    }
  });

  // ws.on("close", () => {
  //   groupIds.forEach((groupId) => {
  //     console.log(`close connection with groupIds: ${groupId}`);
  //     messageService.leaveGroup(groupId, ws);
  //   });
  // });
});
