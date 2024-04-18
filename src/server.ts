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

  ws.on(
    "message",
    (messageData: { type: string; groupIds: string[]; text: string }) => {
      console.log(
        `new message data: ${messageData}  groupIds: ${messageData.groupIds}`
      );
      console.log(`typeOf MessageData ${typeof messageData}`);
      if (messageData.type === "join") {
        groupIds = messageData.groupIds;
        groupIds.forEach((groupId) => messageService.joinGroup(groupId, ws));
      } else if (messageData.type === "message") {
        if (groupIds) {
          console.log(
            `sending message to others clients with this groupIds: ${groupIds}`
          );
          const text = JSON.parse(messageData.text.toString());
          groupIds.forEach((groupId) =>
            messageService.sendMessage(groupId, text, ws)
          );
        }
      } else {
        console.log(`unknown message.type`);
      }
    }
  );

  ws.on("close", () => {
    groupIds.forEach((groupId) => {
      console.log(`close connection with groupIds: ${groupId}`);
      messageService.leaveGroup(groupId, ws);
    });
  });
});
