const dotenv = require("dotenv");
dotenv.config();
const { google } = require("googleapis");
const { fetchFileContent, saveFileContent } = require("../utils/fileAction");
const { createLabels } = require("../utils/gmail");

const { client_id, client_secret, redirect_uri, SCOPES } = process.env;

const Scopes = JSON.parse(SCOPES);

// Authorize the client
const auth = async (req, res) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: Scopes,
    });
    return res.status(200).send(authUrl);
  } catch (error) {
    console.log("error while authenticating gmail", error);
    return res.status(500).json({ error: error.message });
  }
};

// Callback endpoint
const authCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );

    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);

    const fileContent = fetchFileContent();

    let parsedFileContent = {};
    if (fileContent) {
      parsedFileContent = JSON.parse(fileContent);
    }

    // Get user profile information
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get();

    const oldData = parsedFileContent[data.email] || {};

    const updatedFileContent = {
      ...parsedFileContent,
      [data.email]: {
        ...oldData,
        ["tokens"]: tokens,
        ["name"]: data.name,
        ["picture"]: data.picture,
      },
    };

    saveFileContent(JSON.stringify(updatedFileContent));
    await createLabels(oAuth2Client, updatedFileContent, data.email);

    return res.redirect(
      `/information?email=${data.email}&calendlyLink=${oldData.calendlyLink}&isWatching=${oldData.isWatching}`
    );
  } catch (error) {
    console.log("error while authenticating gmail", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  auth,
  authCallback,
};
