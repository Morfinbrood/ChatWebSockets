function generateSimpleUUID() {
    return Math.random().toString(36).substr(2, 9);
}

const clientUuid = generateSimpleUUID();
const socket = new WebSocket("ws://localhost:3000");
const chatWindow = document.getElementById("chatWindow");
const groupInput = document.getElementById("groupInput");
const connectedGroups = document.getElementById("connectedGroups");
let connectedGroupIds = [];

socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
});

socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "message") {
        const messageElement = document.createElement("div");
        messageElement.innerText = String(message.text);
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});

function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = {
        type: "message",
        groupIds: connectedGroupIds,
        text: messageInput.value,
        senderUUID: clientUuid,
    };
    socket.send(JSON.stringify(message));
    messageInput.value = "";
}

function addToGroup() {
    const groupId = groupInput.value.trim();
    if (groupId !== "") {
        const message = {
            type: "join",
            groupId: groupId,
            senderUUID: clientUuid,
        };
        socket.send(JSON.stringify(message));
        connectedGroupIds.push(groupId);
        connectedGroups.innerText += ` ${groupId},`;
        groupInput.value = "";
    }
}

async function sendHttpRequest() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    const response = await fetch("http://localhost:3000/sendHTTPMessage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            type: "message",
            groupIds: connectedGroupIds,
            text: message,
            senderUUID: clientUuid,
        }),
    });

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    messageInput.value = "";
    const data = response.json();
}