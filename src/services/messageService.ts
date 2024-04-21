import WebSocket from "ws";
import { Request, Response } from "express";

import { MessageData } from "../types";

interface GroupConnections {
  [groupId: string]: ClientInfo[];
}

/*
const groupConnections: GroupConnections = {
  "group1": [
    { client: WebSocket1, uuid: "uuid1" },
    { client: WebSocket2, uuid: "uuid2" }
  ],
  "group2": [
    { client: WebSocket3, uuid: "uuid3" }
  ]
};
*/

interface ClientInfo {
  client: WebSocket;
  uuid: string;
}

export class MessageService {
  private static instance: MessageService;
  private groupConnections: GroupConnections = {};

  private constructor(private wss: WebSocket.Server) {}

  public static getInstance(wss: WebSocket.Server): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService(wss);
    }
    return MessageService.instance;
  }

  public handleSocketMessage = (ws: WebSocket, messageData: MessageData) => {
    let messageParsed = JSON.parse(messageData.toString());

    if (messageParsed.type === "join") {
      const { groupId, senderUUID } = messageParsed;
      this.joinGroup(groupId, ws, senderUUID);
    } else if (messageParsed.type === "message") {
      const { groupIds } = messageParsed;
      if (groupIds) {
        const { text, senderUUID } = messageParsed;
        groupIds.forEach((groupId: string) =>
          this.sendGroupMessage(groupId, text, senderUUID)
        );
      }
    } else {
      console.log(`unknown message.type`);
    }
  };

  public handleHTTPMessage = (req: Request, res: Response) => {
    const { groupIds, text, senderUUID } = req.body;

    if (groupIds) {
      groupIds.forEach((groupId: string) =>
        this.sendGroupMessage(groupId, text, senderUUID)
      );
    }

    res.json({ status: "success" });
  };

  public joinGroup(groupId: string, ws: WebSocket, uuid: string) {
    if (!this.groupConnections[groupId]) {
      this.groupConnections[groupId] = [];
    }
    this.groupConnections[groupId].push({ client: ws, uuid: uuid });
  }

  public sendGroupMessage(groupId: string, text: string, senderUUID: string) {
    const connections = this.groupConnections[groupId] || [];
    const receivers = connections.filter(
      (clientInfo) => clientInfo.uuid !== senderUUID
    );
    receivers.forEach((clientInfo: ClientInfo) => {
      const clientSocket = clientInfo.client;
      if (clientSocket.readyState === WebSocket.OPEN) {
        const messageSending = {
          type: "message",
          text: text,
        };
        clientSocket.send(JSON.stringify(messageSending));
      }
    });
  }
}

// public leaveGroup(groupId: string, ws: WebSocket) {
//   if (this.groupConnections[groupId]) {
//     this.groupConnections[groupId] = this.groupConnections[groupId].filter(
//       (connection) => connection !== ws
//     );
//     if (this.groupConnections[groupId].length === 0) {
//       delete this.groupConnections[groupId];
//     }
//   }
// }
