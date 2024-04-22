function generateSimpleUUID() {
    return Math.random().toString(36).substr(2, 9);
}

let clientUuid = generateSimpleUUID();
let socket = null;
let connectedGroupIds = [];

function activateChatButtons() {
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendWSMessageBtn").disabled = false;
    document.getElementById("sendHTTPMessageBtn").disabled = false;
    document.getElementById("groupInput").disabled = false;
    document.getElementById("addToGroupBtn").disabled = false;
}

function deactivateChatButtons() {
    document.getElementById("messageInput").disabled = true;
    document.getElementById("sendWSMessageBtn").disabled = true;
    document.getElementById("sendHTTPMessageBtn").disabled = true;
    document.getElementById("groupInput").disabled = true;
    document.getElementById("addToGroupBtn").disabled = true;
}

function upgradeConnection() {
    socket = new WebSocket("ws://localhost:3000/handleUpgrade");

    socket.addEventListener("open", () => {
        console.log("Connection successfully upgraded to WebSocket!");
        activateChatButtons();
        document.getElementById("handleUpgradeBtn").style.display = "none";

        const upgradeMessage = "Connection successfully upgraded to WebSocket!";
        const upgradeMessageElement = document.createElement("div");
        upgradeMessageElement.style.fontStyle = "italic";
        upgradeMessageElement.innerText = upgradeMessage;
        chatWindow.appendChild(upgradeMessageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
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

    socket.addEventListener("error", (error) => {
        console.error("WebSocket connection error:", error);
    });
}
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
    const groupsElement = document.getElementById("connectedGroups");
    if (groupId !== "") {
        const message = {
            type: "join",
            groupId: groupId,
            senderUUID: clientUuid,
        };
        socket.send(JSON.stringify(message));
        connectedGroupIds.push(groupId);
        groupsElement.innerText += ` ${groupId},`;
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