"use strict";
require("dotenv").config();
const express = require("express");
const path = require("path");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

fccTesting(app); //For FCC testing purposes

// view engine setup
app.set("views", path.join(__dirname, "views/pug"));
app.set("view engine", "pug");

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route("/").get((req, res) => {
   res.render("index", {title: "Hello", message: "Please login"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log("Listening on port " + PORT);
});
