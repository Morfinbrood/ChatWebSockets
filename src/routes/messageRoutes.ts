import express, { Request, Response } from "express";
import { Server } from "ws";
import { MessageService } from "../services/messageService";

const router = express.Router();

export default function messageRoutes(wss: Server) {
  const messageService = MessageService.getInstance(wss);

  router.post("/sendHTTPMessage", (req: Request, res: Response) => {
    console.log(` POST /sendHTTPMessage req.body: ${req.body}`);
    messageService.handleHTTPMessage(req, res);
  });

  return router;
}
