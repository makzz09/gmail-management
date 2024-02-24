const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { auth, authCallback } = require("./handlers/auth");
dotenv.config();

const app = express();
app.use(bodyParser.json());

// set the view engine to ejs
app.set("view engine", "ejs");

app.get("/auth", auth);
app.get("/auth/callback", authCallback);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
