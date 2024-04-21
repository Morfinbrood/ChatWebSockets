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
        this.sendMessageToAllSenderGroupsOnce(groupIds, text, senderUUID);
      }
    } else {
      console.log(`unknown message.type`);
    }
  };

  public handleHTTPMessage = (req: Request, res: Response) => {
    const { groupIds, text, senderUUID } = req.body;

    if (groupIds) {
      this.sendMessageToAllSenderGroupsOnce(groupIds, text, senderUUID);
    }

    res.json({ status: "success" });
  };

  public joinGroup(groupId: string, ws: WebSocket, uuid: string) {
    if (!this.groupConnections[groupId]) {
      this.groupConnections[groupId] = [];
    }
    this.groupConnections[groupId].push({ client: ws, uuid: uuid });
  }

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

/* example values.flat.find
this.groupConnections example
const groupConnections = {
  "group1": [
    { client: "Client1", uuid: "uuid1" },
    { client: "Client2", uuid: "uuid2" }
  ],
  "group2": [
    { client: "Client3", uuid: "uuid3" }
  ]
};
Object.values (this.groupConnections) result
[
  [
    { client: "Client1", uuid: "uuid1" },
    { client: "Client2", uuid: "uuid2" }
  ],
  [
    { client: "Client3", uuid: "uuid3" }
  ]
]
 .flat() result
[
  { client: "Client1", uuid: "uuid1" },
  { client: "Client2", uuid: "uuid2" },
  { client: "Client3", uuid: "uuid3" }
]

*/
