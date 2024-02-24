const { fetchFileContent } = require("../utils/fileAction");

const information = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.redirect("/");
  }

  const fileContent = fetchFileContent();

  if (!fileContent) {
    return res.redirect("/");
  }

  const parsedFileContent = JSON.parse(fileContent);
  const userDetail = parsedFileContent[email];

  if (!userDetail) {
    return res.redirect("/");
  }

  const { calendlyLink, isWatching, picture } = userDetail;

  res.render("pages/information", {
    email,
    calendlyLink,
    isWatching,
    picture,
  });
};

module.exports = {
  information,
};
