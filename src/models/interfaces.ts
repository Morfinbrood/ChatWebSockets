import WebSocket from "ws";
import { Request, Response } from "express";

export interface JoinMessage {
  type: "join";
  groupId: string;
  senderUUID: string;
}

export interface RegularMessage {
  type: "message";
  groupIds: string[];
  text: string;
  senderUUID: string;
}

export interface ClientInfo {
  client: WebSocket;
  uuid: string;
}

export interface GroupConnections {
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

export interface MessageService {
  getInstance(wss: WebSocket.Server): MessageService;
  handleSocketMessage(
    ws: WebSocket,
    messageData: JoinMessage | RegularMessage
  ): void;
  joinGroup(groupId: string, ws: WebSocket, uuid: string): void;
  handleHTTPMessage(req: Request, res: Response): void;
  handleJoinMessage(messageParsed: JoinMessage, ws: WebSocket): void;
  handleRegularMessage(messageParsed: RegularMessage): void;
  sendMessageToAllSenderGroupsOnce(
    groupIds: string[],
    text: string,
    senderUUID: string
  ): void;
}
