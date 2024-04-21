import WebSocket from "ws";
import { Request, Response } from "express";

import { JoinMessage, RegularMessage } from "../types";
import { ClientInfo, GroupConnections } from "../models/interfaces";

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

  public handleSocketMessage(
    ws: WebSocket,
    messageData: JoinMessage | RegularMessage
  ) {
    let messageParsed = JSON.parse(messageData.toString());
    const { senderUUID } = messageParsed;
    switch (messageParsed.type) {
      case "join":
        const { groupId } = messageParsed;
        this.handleJoinMessage(groupId, senderUUID, ws);
        break;
      case "message":
        const { groupIds, text } = messageParsed;
        this.handleRegularMessage(groupIds, text, senderUUID);
        break;
      default:
        console.log(`Unknown message type`);
        break;
    }
  }

  public joinGroup(groupId: string, ws: WebSocket, uuid: string) {
    if (!this.groupConnections[groupId]) {
      this.groupConnections[groupId] = [];
    }
    this.groupConnections[groupId].push({ client: ws, uuid: uuid });
  }

  public handleHTTPMessage(req: Request, res: Response) {
    const { groupIds, text, senderUUID } = req.body;
    this.handleRegularMessage(groupIds, text, senderUUID);
    res.json({ status: "success" });
  }

  private handleJoinMessage(
    groupId: string,
    senderUUID: string,
    ws: WebSocket
  ) {
    this.joinGroup(groupId, ws, senderUUID);
  }

  private handleRegularMessage(
    groupIds: string[],
    text: string,
    senderUUID: string
  ) {
    if (groupIds && groupIds.length > 0) {
      this.sendMessageToAllSenderGroupsOnce(groupIds, text, senderUUID);
    } else {
      console.log(`No groupIds provided`);
    }
  }

  public sendMessageToAllSenderGroupsOnce(
    groupIds: string[],
    text: string,
    senderUUID: string
  ) {
    const uniqueReceiversUUDIs = this.getUniqueReceiversUUIDs(
      groupIds,
      senderUUID
    );
    uniqueReceiversUUDIs.forEach((receiverUUID: string) => {
      this.sendMessageToOnlineRecievers(receiverUUID, text, senderUUID);
    });
  }

  private getUniqueReceiversUUIDs(
    groupIds: string[],
    senderUUID: string
  ): Set<string> {
    const uniqueReceiversUUDIs: Set<string> = new Set();

    groupIds.forEach((groupId: string) => {
      const connections = this.groupConnections[groupId] || [];
      connections.forEach((clientInfo: ClientInfo) => {
        if (clientInfo.uuid !== senderUUID) {
          uniqueReceiversUUDIs.add(clientInfo.uuid);
        }
      });
    });

    return uniqueReceiversUUDIs;
  }

  private sendMessageToOnlineRecievers(
    receiverUUID: string,
    text: string,
    senderUUID: string
  ) {
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
  }
}
