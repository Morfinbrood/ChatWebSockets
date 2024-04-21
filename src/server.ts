import express from "express";
import WebSocket from "ws";
import { MessageService } from "./services/messageService";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
      const clientUuid = message.clientUuid; // Получаем clientUuid
      messageService.joinGroup(groupId, ws, clientUuid);
    } else if (message.type === "message") {
      groupIds = message.groupIds;
      if (groupIds) {
        const text = String(message.text);
        groupIds.forEach((groupId) =>
          messageService.sendGroupMessage(groupId, text, message.senderUUID)
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

app.post("/sendHTTPMessage", (req, res) => {
  const groupIds = req.body.groupIds;
  const text = String(req.body.message);
  const senderUUID = req.body.senderUUID;

  if (groupIds) {
    groupIds.forEach((groupId: string) =>
      messageService.sendGroupMessage(groupId, text, senderUUID)
    );
  }

  res.json({ status: "success" });
});
