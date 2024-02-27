const { saveFileContent, fetchFileContent } = require("../utils/fileAction");
const { getAuthenticatedGmail } = require("../utils/gmail");
const { fetchMessagesFromHistory } = require("../utils/processMail");

const notification = async (req, res) => {
  try {
    const message = req.body.message.data
      ? Buffer.from(req.body.message.data, "base64").toString()
      : "No data provided";

    const msgObj = JSON.parse(message);

    console.log("message ===>", msgObj);

    const fileContent = fetchFileContent();
    let parsedFileContent = null;

    if (fileContent) {
      parsedFileContent = JSON.parse(fileContent);
    }

    const userDetail = parsedFileContent[msgObj.emailAddress];
    const tokens = userDetail?.tokens;
    const prevHistoryId = userDetail?.historyId;

    if (!parsedFileContent || !userDetail || !tokens || !prevHistoryId) {
      const updatedFileContent = {
        ...parsedFileContent,
        [msgObj.emailAddress]: {
          ...userDetail,
          historyId: msgObj.historyId,
        },
      };
      saveFileContent(JSON.stringify(updatedFileContent));
      return res.status(500).json({ error: "No file content found" });
    }

    const updatedFileContent = {
      ...parsedFileContent,
      [msgObj.emailAddress]: {
        ...userDetail,
        historyId: msgObj.historyId,
      },
    };
    saveFileContent(JSON.stringify(updatedFileContent));
    console.log("updated history to", msgObj.historyId);

    const authenticatedGmail = await getAuthenticatedGmail(msgObj.emailAddress);

    await fetchMessagesFromHistory(
      authenticatedGmail,
      prevHistoryId,
      msgObj.emailAddress
    );

    return res.status(200).json({ message: "notification sent" });
  } catch (error) {
    console.log("error while sending notification", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  notification,
};
