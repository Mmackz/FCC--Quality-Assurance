require("dotenv").config()
const bcrypt = require("bcrypt")
const passport = require("passport");
const mongoDB = require("mongodb");
const LocalStrategy = require("passport-local");
const GitHubStrategy = require("passport-github").Strategy;

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

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://fccadvancednode.mmackz.repl.co/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    myDataBase.findOneAndUpdate(
  { id: profile.id },
  {
    $setOnInsert: {
      id: profile.id,
      name: profile.displayName || 'John Doe',
      photo: profile.photos[0].value || '',
      email: Array.isArray(profile.emails)
        ? profile.emails[0].value
        : 'No public email',
      created_on: new Date(),
      provider: profile.provider || ''
    },
    $set: {
      last_login: new Date()
    },
    $inc: {
      login_count: 1
    }
  },
  { upsert: true, new: true },
  (err, doc) => {
    return cb(null, doc.value);
  }
);

  }
));

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
