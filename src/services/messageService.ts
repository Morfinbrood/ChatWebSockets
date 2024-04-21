import WebSocket from "ws";
import { Request, Response } from "express";

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

  public handleSocketMessage = (ws: WebSocket, messageData: any) => {
    let message = JSON.parse(messageData.toString());

    if (message.type === "join") {
      const groupId = message.groupId;
      const clientUuid = message.clientUuid;
      this.joinGroup(groupId, ws, clientUuid);
    } else if (message.type === "message") {
      const groupIds: string[] = message.groupIds;
      if (groupIds) {
        const text = String(message.text);
        groupIds.forEach((groupId) =>
          this.sendGroupMessage(groupId, text, message.senderUUID)
        );
      }
    } else {
      console.log(`unknown message.type`);
    }
  };

  public handleHTTPMessage = (req: Request, res: Response) => {
    const { groupIds, message, senderUUID } = req.body;

    if (groupIds) {
      groupIds.forEach((groupId: string) =>
        this.sendGroupMessage(groupId, message, senderUUID)
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

  public sendGroupMessage(
    groupId: string,
    message: string,
    senderUUID: string
  ) {
    const connections = this.groupConnections[groupId] || [];
    const receivers = connections.filter(
      (clientInfo) => clientInfo.uuid !== senderUUID
    );
    receivers.forEach((clientInfo: ClientInfo) => {
      const clientSocket = clientInfo.client;
      if (clientSocket.readyState === WebSocket.OPEN) {
        const messageSending = {
          type: "message",
          text: message,
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
