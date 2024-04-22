import express from "express";
import http from "http";
import WebSocket from "ws";
import { MessageService } from "./services/messageService";
import cors from "cors";

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

server.on("upgrade", (request, socket, head) => {
  console.log(`get request to handleUpgrade`);
  if (request.url === "/handleUpgrade" && request.method === "GET") {
    wss.handleUpgrade(request, socket, head, (connection) => {
      console.log("Connection upgraded");
      wss.emit("connection", connection, request);
    });
  } else {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
  }
});

app.post("/sendHTTPMessage", (req, res) => {
  console.log(` POST /sendHTTPMessage req.body: ${req.body}`);
  messageService.handleHTTPMessage(req, res);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
