import WebSocket from "ws";

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
