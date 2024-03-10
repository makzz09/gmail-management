const { fetchFileContent } = require("../utils/fileAction");

const userInfo = async (req, res) => {
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

  if (userDetail.refreshTokenError) {
    return res.redirect("/");
  }

  const { calendlyLink, isWatching, picture, draftMail } = userDetail;

  res.render("pages/user", {
    email,
    calendlyLink,
    isWatching,
    picture,
    draftMail,
  });
};

module.exports = {
  userInfo,
};
