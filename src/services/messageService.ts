import WebSocket from "ws";
import { Request, Response } from "express";

import { JoinMessage, RegularMessage } from "../types";

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

  public handleSocketMessage = (
    ws: WebSocket,
    messageData: JoinMessage | RegularMessage
  ) => {
    let messageParsed = JSON.parse(messageData.toString());
    switch (messageParsed.type) {
      case "join":
        this.handleJoinMessage(messageParsed as JoinMessage, ws);
        break;
      case "message":
        this.handleRegularMessage(messageParsed as RegularMessage);
        break;
      default:
        console.log(`Unknown message type`);
        break;
    }
  };

  public joinGroup(groupId: string, ws: WebSocket, uuid: string) {
    if (!this.groupConnections[groupId]) {
      this.groupConnections[groupId] = [];
    }
    this.groupConnections[groupId].push({ client: ws, uuid: uuid });
  }

  public handleHTTPMessage = (req: Request, res: Response) => {
    this.handleRegularMessage(req.body as RegularMessage);
    res.json({ status: "success" });
  };

  private handleJoinMessage = (
    { groupId, senderUUID }: JoinMessage,
    ws: WebSocket
  ) => {
    this.joinGroup(groupId, ws, senderUUID);
  };

  private handleRegularMessage = ({
    groupIds,
    text,
    senderUUID,
  }: RegularMessage) => {
    if (groupIds && groupIds.length > 0) {
      this.sendMessageToAllSenderGroupsOnce(groupIds, text, senderUUID);
    } else {
      console.log(`No groupIds provided`);
    }
  };

  public sendMessageToAllSenderGroupsOnce(
    groupIds: string[],
    text: string,
    senderUUID: string
  ) {
    const uniqueReceiversUUDIs: Set<string> = new Set();

    groupIds.forEach((groupId: string) => {
      const connections = this.groupConnections[groupId] || [];
      connections.forEach((clientInfo: ClientInfo) => {
        if (clientInfo.uuid !== senderUUID) {
          uniqueReceiversUUDIs.add(clientInfo.uuid);
        }
      });
    });

    uniqueReceiversUUDIs.forEach((receiverUUID: string) => {
      if (receiverUUID !== senderUUID) {
        const [clientInfo] = Object.values(this.groupConnections)
          .flat()
          .filter((client) => client.uuid === receiverUUID);
        if (clientInfo) {
          const clientSocket = clientInfo.client;
          if (clientSocket.readyState === WebSocket.OPEN) {
            const messageSending = {
              type: "message",
              text: text,
            };
            clientSocket.send(JSON.stringify(messageSending));
          }
        }
      }
    });
  }
}
