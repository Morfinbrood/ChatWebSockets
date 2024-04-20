import WebSocket from "ws";

interface GroupConnections {
  [groupId: string]: WebSocket[];
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

  public joinGroup(groupId: string, ws: WebSocket) {
    if (!this.groupConnections[groupId]) {
      this.groupConnections[groupId] = [];
    }
    this.groupConnections[groupId].push(ws);
  }

  public sendGroupMessage(groupId: string, message: string, sender: WebSocket) {
    console.log(
      ` MessageService:sendGroupMessage groupId${groupId}  message: ${message} sender: ${sender}`
    );
    const connections = this.groupConnections[groupId] || [];
    connections.forEach((connection) => {
      if (connection !== sender && connection.readyState === WebSocket.OPEN) {
        const messageSending = {
          type: "message",
          text: message,
        };
        console.log(
          ` MessageService:sendGroupMessage for every group groupId: ${groupId}  message: ${message} sender: ${sender}`
        );
        console.log(` if (connection !== sender) : ${connection !== sender}`);
        connection.send(JSON.stringify(messageSending));
      }
    });
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
}
