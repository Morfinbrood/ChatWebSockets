import { Request, Response } from "express";
import WebSocket from "ws";

export const upgradeMiddleware = (wss: WebSocket.Server) => (req: Request, socket: any, head: Buffer) => {
  if (req.url === "/handleUpgrade" && req.method === "GET") {
    wss.handleUpgrade(req, socket, head, (connection) => {
      console.log("Connection upgraded");
      wss.emit("connection", connection, req);
    });
  } else {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
  }
};
