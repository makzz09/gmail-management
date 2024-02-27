const { attachLabels } = require("./openAi");

const fetchMessagesFromHistory = async (
  authenticatedGmail,
  historyId,
  userEmail
) => {
  try {
    const res = await authenticatedGmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
    });

    const history = res.data.history;

    console.log("history ===>", history);

    if (history) {
      if (history.length) {
        let msgs = [];
        history.forEach((item) => {
          const messagesAdded = item.messagesAdded;

          if (messagesAdded) {
            for (let index = 0; index < messagesAdded.length; index++) {
              const message = messagesAdded[index].message;
              const labels = message.labelIds || [];

              // Check if the message has the "INBOX" label
              if (labels.includes("INBOX")) {
                msgs.push({
                  id: message.id,
                  threadId: message.threadId,
                });
              }
            }
          }
        });
        if (msgs.length) {
          msgs = msgs.reduce((newArr, current) => {
            const x = newArr.find(
              (item) =>
                item.id === current.id || item.threadId === current.threadId
            );
            if (!x) {
              return newArr.concat([current]);
            } else {
              return newArr;
            }
          }, []);
        }

        const msgIds = [];
        for (let index = 0; index < msgs.length; index++) {
          const messageId = msgs[index].id;
          const threadId = msgs[index].threadId;
          const msg = await getMessageData(authenticatedGmail, messageId); // Fetch content for each unique message
          if (msg == null || msg == undefined) {
            continue;
          }
          msgIds.push(messageId);
          await processBody(
            authenticatedGmail,
            msg,
            messageId,
            threadId,
            userEmail
          );
        }
      }
      return res.data;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("Requested entity was not found.");
      return;
    }
    console.log("error while fetching messages from history", error);
    throw error;
  }
};

const getMessageData = async (authenticatedGmail, messageId) => {
  try {
    return await authenticatedGmail.users.messages.get({
      userId: "me",
      id: messageId,
    });
  } catch (error) {
    console.log("error while fetching message data", error);
    throw error;
  }
};

const processBody = async (
  authenticatedGmail,
  msg,
  messageId,
  threadId,
  userEmail
) => {
  try {
    const payload = msg.data.payload;
    const headers = payload.headers;
    const parts = payload.parts;
    const emailType = payload.mimeType;
    if (headers == null || headers == undefined) {
      return;
    }

    const email = {
      id: msg.data.id,
      from: "",
      to: "",
      subject: "",
      snippet: msg.data.snippet,
      bodyText: "",
      bodyHtml: "",
    };

    if (emailType.includes("plain")) {
      email.bodyText = payload.body.data;
    } else {
      if (parts == null || parts == undefined) {
        email.bodyText = payload.body.data;
      } else {
        parts.forEach((part) => {
          const mimeType = part.mimeType;
          switch (mimeType) {
            case "text/plain":
              email.bodyText = part.body.data;
              break;
            case "text/html":
              email.bodyHtml = part.body.data;
              break;
          }
        });
      }
    }

    headers.forEach((header) => {
      const name = header.name;
      switch (name) {
        case "To":
          email.to = header.value;
          break;
        case "From":
          email.from = header.value;
          break;
        case "Subject":
          email.subject = header.value;
          break;
      }
    });

    if (email.from.includes("<mailer-daemon@googlemail.com>")) {
      // Skip processing mail from mailer-daemon, failed delivery notifications
      return true;
    }

    await attachLabels(
      authenticatedGmail,
      email,
      messageId,
      userEmail,
      threadId
    );

    return email;
  } catch (error) {
    console.log("error while processing message body", error);
    throw error;
  }
};

module.exports = {
  fetchMessagesFromHistory,
};
