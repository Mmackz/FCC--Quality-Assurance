const bcrypt = require("bcrypt")
const passport = require("passport");
const mongoDB = require("mongodb");
const LocalStrategy = require("passport-local");

const ObjectID = mongoDB.ObjectID;

module.exports = function (app, myDataBase) {
   passport.use(
      new LocalStrategy((username, password, done) => {
         myDataBase.findOne({ username }, (err, user) => {
            console.log(`User ${username} attempted to login.`);
            if (err) return done(err);
            if (!user || !bcrypt.compareSync(password, user.password))
               return done(null, false);
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
};
