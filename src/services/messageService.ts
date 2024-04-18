import WebSocket from 'ws';

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

  public sendMessage(groupId: string, message: string, sender: WebSocket) {
    const connections = this.groupConnections[groupId] || [];
    connections.forEach(connection => {
      if (connection !== sender && connection.readyState === WebSocket.OPEN) {
        connection.send(message);
      }
    });
  }

  public leaveGroup(groupId: string, ws: WebSocket) {
    if (this.groupConnections[groupId]) {
      this.groupConnections[groupId] = this.groupConnections[groupId].filter(connection => connection !== ws);
      if (this.groupConnections[groupId].length === 0) {
        delete this.groupConnections[groupId];
      }
    }
  }
}
