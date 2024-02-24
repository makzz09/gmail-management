const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { auth, authCallback } = require("./handlers/auth");
const { information } = require("./handlers/information");
dotenv.config();

const app = express();
app.use(bodyParser.json());

// set the view engine to ejs
app.set("view engine", "ejs");

// render views
app.get("/", (req, res) => {
  res.render("pages/index");
});

app.get("/information", information);

// Authorization routes
app.post("/auth", auth);
app.get("/auth/callback", authCallback);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
