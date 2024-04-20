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
  console.log(`connection WebSocket: ${ws}`);

  ws.on("message", (messageData: any) => {
    let message;
    try {
      message = JSON.parse(messageData.toString());
    } catch (error) {
      console.error("Error parsing message:", error);
      return;
    }

    console.log(`Received message:`, message);

    if (message.type === "join") {
      const groupId = message.groupId;
      messageService.joinGroup(groupId, ws);
    } else if (message.type === "message") {
      if (groupIds) {
        console.log(
          `sending message to others clients with this groupIds: ${groupIds}`
        );
        const text = JSON.parse(message.text.toString());
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
