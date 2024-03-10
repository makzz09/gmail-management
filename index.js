const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { auth, authCallback } = require("./handlers/auth");
const { userInfo } = require("./handlers/userInfo");
const { isLoggedIn } = require("./middlerware/middlewares");
const {
  startWatch,
  stopWatch,
  toggleReplyType,
} = require("./handlers/watcher");
const { addCalendly } = require("./handlers/calendly");
const cronJob = require("./utils/cronJob");
const { notification } = require("./handlers/notification");
dotenv.config();

cronJob();

const app = express();
app.use(bodyParser.json());

// set the view engine to ejs
app.set("view engine", "ejs");

// render views
app.get("/", (req, res) => {
  res.render("pages/index");
});

app.get("/user", userInfo);

// Authorization routes
app.post("/auth", auth);
app.get("/auth/callback", authCallback);

// watcher routes
app.get("/watch", isLoggedIn, startWatch);
app.get("/stopwatch", isLoggedIn, stopWatch);
app.post("/calendly", isLoggedIn, addCalendly);
app.get("/toggle", isLoggedIn, toggleReplyType);

// Webhook route
app.post("/notification", notification);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
