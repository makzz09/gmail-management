const { fetchFileContent } = require("../utils/fileAction");
const { getAuthenticatedGmail } = require("../utils/gmail");

const isLoggedIn = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const fileContent = fetchFileContent();

    if (!fileContent) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsedFileContent = JSON.parse(fileContent);
    const tokens = parsedFileContent[email];

    if (!tokens) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const authenticatedGmail = await getAuthenticatedGmail(email);

    req.authenticatedGmail = authenticatedGmail;
    req.parsedFileContent = parsedFileContent;

    next();
  } catch (error) {
    console.log("isLOgged in", error);
    throw error;
  }
};

module.exports = {
  isLoggedIn,
};
