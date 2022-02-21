"use strict";
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const routes = require("./routes");
const auth = require("./auth");

const app = express();
fccTesting(app); //For FCC testing purposes

// view engine setup
app.set("views", path.join(__dirname, "views/pug"));
app.set("view engine", "pug");

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// express-session setup
app.use(
   session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      cookie: { secure: false }
   })
);

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
   const myDataBase = await client.db("database").collection("users");
   auth(app, myDataBase);
   routes(app, myDataBase);
}).catch((err) => {
   app.route("/").get((req, res) => {
      res.render("index", { title: err, message: "Unable to login" });
   });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log("Listening on port " + PORT);
});
