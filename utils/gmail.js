const dotenv = require("dotenv");
dotenv.config();
const { google } = require("googleapis");
const { fetchFileContent, saveFileContent } = require("./fileAction");

const { client_id, client_secret, redirect_uri } = process.env;

const getAuthenticatedGmail = async (email) => {
  try {
    const fileContent = fetchFileContent();

    const parsedFileContent = JSON.parse(fileContent);

    const useDetails = parsedFileContent[email];

    if (!useDetails || !useDetails.tokens) {
      throw new Error("No tokens found for the user");
    }

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );

    oAuth2Client.setCredentials(useDetails.tokens);

    if (oAuth2Client.isTokenExpiring()) {
      console.log("refreshing token for user", email);
      const response = await oAuth2Client.refreshAccessToken();

      oAuth2Client.setCredentials(response.credentials);

      const updatedFileContent = {
        ...parsedFileContent,
        [email]: {
          ...useDetails,
          ["tokens"]: response.credentials,
        },
      };

      saveFileContent(JSON.stringify(updatedFileContent));
      console.log("token refreshed for user", email);
    }

    return google.gmail({ version: "v1", auth: oAuth2Client });
  } catch (error) {
    console.log("error while getting authenticated gmail", error);
    throw error;
  }
};

const createLabels = async (oAuth2Client, parsedFileContent, email) => {
  try {
    const authenticatedGmail = google.gmail({
      version: "v1",
      auth: oAuth2Client,
    });

    const labels = ["Positive", "Neutral", "Negative"];

    const usersLabels = await authenticatedGmail.users.labels.list({
      userId: "me",
    });

    const existingLabelsData = usersLabels?.data?.labels || [];
    const existingLabelsMap = existingLabelsData.reduce((acc, label) => {
      acc[label.name.toLowerCase()] = {
        name: label.name.toLowerCase(),
        id: label.id,
      };
      return acc;
    }, {});

    const existingLabels = [];
    const nonExistingLabels = [];

    labels.forEach((label) => {
      const lowercaseLabel = label.toLowerCase();
      if (existingLabelsMap[lowercaseLabel]) {
        existingLabels.push(existingLabelsMap[lowercaseLabel]);
      } else {
        nonExistingLabels.push(label);
      }
    });

    const createLabelRequests = nonExistingLabels.map(async (label) => {
      const res = await authenticatedGmail.users.labels.create({
        userId: "me",
        resource: {
          name: label,
        },
      });
      return {
        name: res.data.name.toLowerCase(),
        id: res.data.id,
      };
    });

    const createdLabels = await Promise.all(createLabelRequests);
    existingLabels.push(...createdLabels);

    const labelsObj = existingLabels.reduce((acc, label) => {
      acc[label.name] = label.id;
      return acc;
    }, {});

    const userDetail = parsedFileContent[email] || {};
    const updatedFileContent = {
      ...parsedFileContent,
      [email]: {
        ...userDetail,
        labels: labelsObj,
      },
    };

    saveFileContent(JSON.stringify(updatedFileContent));

    return true;
  } catch (error) {
    console.log("error while creating labels", error);
    throw error;
  }
};

module.exports = {
  getAuthenticatedGmail,
  createLabels,
};
