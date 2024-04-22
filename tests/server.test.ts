import WebSocket from "ws";

describe("WebSocket Server Tests", () => {
  let socket1: WebSocket;
  let socket2: WebSocket;

  afterEach(() => {
    // Close WebSocket connections after each test
    if (socket1 && socket1.readyState === WebSocket.OPEN) {
      socket1.close();
    }
    if (socket2 && socket2.readyState === WebSocket.OPEN) {
      socket2.close();
    }
  });

  it("should establish WebSocket connections", (done) => {
    socket1 = new WebSocket("ws://localhost:3000/handleUpgrade");
    socket2 = new WebSocket("ws://localhost:3000/handleUpgrade");

    socket1.addEventListener("open", () => {
      expect(socket1.readyState).toBe(WebSocket.OPEN);
    });

    socket2.addEventListener("open", () => {
      expect(socket2.readyState).toBe(WebSocket.OPEN);
      done();
    });
  });

  it("client 1 should receive regular message when client 2 sends regular message", (done) => {
    socket1 = new WebSocket("ws://localhost:3000/handleUpgrade");
    socket2 = new WebSocket("ws://localhost:3000/handleUpgrade");

    socket1.addEventListener("open", () => {
      const message = JSON.stringify({
        type: "join",
        groupId: "group1",
        senderUUID: "client1Uuid",
      });
      socket1.send(message);
    });

    socket2.addEventListener("open", () => {
      const message = JSON.stringify({
        type: "join",
        groupId: "group1",
        senderUUID: "client2Uuid",
      });
      socket2.send(message);
    });

    socket1.addEventListener("message", (event: any) => {
      const message = JSON.parse(event.data);
      expect(message.type).toBe("message");
      expect(message.text).toBe("test msg1");
      done();
    });

    setTimeout(() => {
      const message = JSON.stringify({
        type: "message",
        groupIds: ["group1"],
        senderUUID: "client2Uuid",
        text: "test msg1",
      });
      socket2.send(message);
    }, 500);
  });
});
