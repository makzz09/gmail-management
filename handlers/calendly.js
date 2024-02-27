const { saveFileContent } = require("../utils/fileAction");

const addCalendly = async (req, res) => {
  try {
    const { email } = req.query;
    const parsedFileContent = req.parsedFileContent;

    const userDetail = parsedFileContent[email] || {};

    if (!req.body.calendlyLink) {
      return res.status(400).json({ error: "Invalid link" });
    }

    const updatedFileContent = {
      ...parsedFileContent,
      [email]: {
        ...userDetail,
        calendlyLink: req.body.calendlyLink,
      },
    };

    saveFileContent(JSON.stringify(updatedFileContent));

    return res.status(200).json({ message: "Calendly link added" });
  } catch (error) {
    console.log("error while adding calendly link", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addCalendly,
};
