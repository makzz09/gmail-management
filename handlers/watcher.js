const dotenv = require("dotenv");
const { saveFileContent } = require("../utils/fileAction");
dotenv.config();

const startWatch = async (req, res) => {
  try {
    const authenticatedGmail = req.authenticatedGmail;

    if (!authenticatedGmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await authenticatedGmail.users.stop({
      userId: "me",
    });

    const response = await authenticatedGmail.users.watch({
      userId: "me",
      resource: {
        topicName: process.env.PUBSUB_TOPIC,
      },
    });

    const fileContent = req.parsedFileContent;

    const userDetail = fileContent[req.query.email] || {};

    const updatedFileContent = {
      ...fileContent,
      [req.query.email]: {
        ...userDetail,
        historyId: response.data.historyId,
        isWatching: true,
      },
    };

    saveFileContent(JSON.stringify(updatedFileContent));

    return res
      .status(200)
      .json({ message: "watch started", data: response.data });
  } catch (error) {
    console.log("error while starting watch", error);
    return res.status(500).json({ error: error.message });
  }
};

const stopWatch = async (req, res) => {
  try {
    const authenticatedGmail = req.authenticatedGmail;

    if (!authenticatedGmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await authenticatedGmail.users.stop({
      userId: "me",
    });

    const fileContent = req.parsedFileContent;
    const userDetail = fileContent[req.query.email] || {};

    const updatedFileContent = {
      ...fileContent,
      [req.query.email]: {
        ...userDetail,
        isWatching: false,
      },
    };

    saveFileContent(JSON.stringify(updatedFileContent));

    return res.status(200).json({ message: "watch stopped" });
  } catch (error) {
    console.log("error while stopping watch", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  startWatch,
  stopWatch,
};
