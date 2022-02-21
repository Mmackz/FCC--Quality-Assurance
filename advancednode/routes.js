const bcrypt = require("bcrypt");
const passport = require("passport");

function ensureAuthenticated(req, res, next) {
   if (req.isAuthenticated()) {
      return next();
   }
   res.redirect("/");
}

module.exports = function (app, myDataBase) {
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
                     password: bcrypt.hashSync(req.body.password, 12)
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
};
