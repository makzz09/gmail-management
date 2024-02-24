const fs = require("fs");

const filePath = "storage/tokens.json";

// check if the file exists if not create it
const fileExists = () => {
  try {
    const exists = fs.existsSync(filePath);

    if (!exists) {
      const array = {};
      fs.writeFileSync(filePath, JSON.stringify(array));
    }

    return exists;
  } catch (error) {
    throw error;
  }
};

// read the file and return the data
const fetchFileContent = () => {
  try {
    fileExists(filePath);

    const content = fs.readFileSync(filePath, "utf8");

    return content;
  } catch (error) {
    console.log("error while fetching file content", error);
    throw error;
  }
};

// write the content to the file
const saveFileContent = (content) => {
  try {
    fileExists(filePath);
    fs.writeFileSync(filePath, content);

    return true;
  } catch (error) {
    console.log("error while saving file content", error);
    throw error;
  }
};

module.exports = {
  saveFileContent,
  fetchFileContent,
  fileExists,
};
