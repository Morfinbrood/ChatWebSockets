type JoinMessage = {
  type: "join";
  groupId: string;
};

type RegularMessage = {
  type: "message";
  groupIds: string[];
  text: string;
};

export type MessageData = (JoinMessage | RegularMessage) & {
  senderUUID: string;
};
