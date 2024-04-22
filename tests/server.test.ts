import WebSocket from "ws";
import request from "supertest";

describe("Integration Tests", () => {
  let serverUrl = "http://localhost:3000";
  let ws1: WebSocket, ws2: WebSocket, ws3: WebSocket;
  let ws1Messages: any[] = [];
  let ws2Messages: any[] = [];
  let ws3Messages: any[] = [];
  let ws1Groups: string[] = [];
  let ws2Groups: string[] = [];
  let ws3Groups: string[] = [];

  let ws1UpgradeLog: string[] = [];
  let ws2UpgradeLog: string[] = [];
  let ws3UpgradeLog: string[] = [];

  beforeAll((done) => {
    ws1 = new WebSocket(`${serverUrl}/socket`);
    ws2 = new WebSocket(`${serverUrl}/socket`);
    ws3 = new WebSocket(`${serverUrl}/socket`);

    ws1.on("message", (message: any) => {
      ws1Messages.push(message);
    });
    ws2.on("message", (message: any) => {
      ws2Messages.push(message);
    });
    ws3.on("message", (message: any) => {
      ws3Messages.push(message);
    });

    ws1.on("join", (message: any) => {
      ws1Groups.push(message);
    });
    ws2.on("join", (message: any) => {
      ws2Groups.push(message);
    });
    ws3.on("join", (message: any) => {
      ws3Groups.push(message);
    });

    ws1.on("upgrade", () => {
      ws1UpgradeLog.push("upgrade");
    });

    ws2.on("upgrade", () => {
      ws2UpgradeLog.push("upgrade");
    });

    ws3.on("upgrade", () => {
      ws3UpgradeLog.push("upgrade");
    });

    const waitForConnection = () => {
      if (ws1.readyState === WebSocket.OPEN && ws2.readyState === WebSocket.OPEN && ws3.readyState === WebSocket.OPEN) {
        done();
      } else {
        setTimeout(waitForConnection, 100);
      }
    };

    waitForConnection();
  });

  test("test 1: handleUpgrade event occurred", async () => {
    expect(ws1UpgradeLog.length).toBe(1);
    expect(ws1UpgradeLog[0]).toBe("upgrade");
    expect(ws2UpgradeLog.length).toBe(1);
    expect(ws2UpgradeLog[0]).toBe("upgrade");
    expect(ws3UpgradeLog.length).toBe(1);
    expect(ws3UpgradeLog[0]).toBe("upgrade");
  });

  test("test 2: Client 1 sends message via HTTP request and waiting that no one ws triggered message ivent", async () => {
    await request(serverUrl)
      .post("/sendHTTPMessage")
      .send({ type: "message", groupIds: ["group1"], text: "Message from client 1" })
      .expect(200);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(ws1Messages.length).toBe(0);
    expect(ws2Messages.length).toBe(0);
    expect(ws3Messages.length).toBe(0);
  });

  test("test 3: Client 1 and client 2 join group 1, then client 1 sends a test message", async () => {
    ws1.send(JSON.stringify({ type: "join", groupId: "group1", senderUUID: "client1UUID" }));

    ws2.send(JSON.stringify({ type: "join", groupId: "group1", senderUUID: "client2UUID" }));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const testMessage = "test msg to groups 1";
    ws1.send(JSON.stringify({ type: "message", groupIds: ["group1"], text: testMessage, senderUUID: "client1UUID" }));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(ws1Messages.length).toBe(0);
    expect(ws2Messages.length).toBe(1);
    expect(JSON.parse(ws2Messages[0]).text).toBe(testMessage);
  });

  afterAll(() => {
    ws1.close();
    ws2.close();
    ws3.close();
  });
});
