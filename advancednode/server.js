"use strict";
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const mongoDB = require("mongodb");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const LocalStrategy = require("passport-local");

const app = express();
const ObjectID = mongoDB.ObjectID;

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

function ensureAuthenticated(req, res, next) {
   if (req.isAuthenticated()) {
      return next();
   }
   res.redirect("/");
}

myDB(async (client) => {
   const myDataBase = await client.db("database").collection("users");

   app.route("/").get((req, res) => {
      res.render("index", {
         title: "Connected to Database",
         message: "Please login",
         showLogin: true,
         showRegistration: true
      });
   });

   app.post(
      "/login",
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
         res.redirect("/profile");
      }
   );

   app.route("/register").post(
      (req, res, next) => {
         myDataBase.findOne({ username: req.body.username }, (err, user) => {
            if (err) return next(err);
            if (user) res.redirect("/");
            else {
               myDataBase.insertOne(
                  {
                     username: req.body.username,
                     password: req.body.password
                  },
                  (err, doc) => {
                     if (err) res.redirect("/");
                     else {
                        next(null, doc.ops[0]);
                     }
                  }
               );
            }
         });
      },
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
         res.redirect("/profile");
      }
   );

   app.get("/profile", ensureAuthenticated, (req, res) => {
      res.render("profile", { username: req.user.username });
   });

   app.get("/logout", (req, res) => {
      req.logout();
      res.redirect("/");
   });

   app.use((req, res, next) => {
      res.status(404).type("text").send("Not Found");
   });

   passport.use(
      new LocalStrategy((username, password, done) => {
         myDataBase.findOne({ username }, (err, user) => {
            console.log(`User ${username} attempted to login.`);
            if (err) return done(err);
            if (!user || password !== user.password) return done(null, false);
            return done(null, user);
         });
      })
   );

   passport.serializeUser((user, done) => {
      console.log(user);
      done(null, user._id);
   });

   passport.deserializeUser((id, done) => {
      myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
         console.log(doc);
         done(null, doc);
      });
   });
}).catch((err) => {
   app.route("/").get((req, res) => {
      res.render("index", { title: err, message: "Unable to login" });
   });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log("Listening on port " + PORT);
});
