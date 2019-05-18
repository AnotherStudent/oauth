const express = require('express');
const app = express();
const port = 8081;
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

app.use(session({ secret: "supersecret", resave: true, saveUninitialized: true }));

let Users = [{'login': 'admin-yandex', 'email':'YOUR_YANDEX@yandex.ru'},
             {'login': 'admin-google', 'email':'YOUR_GOOGLE@gmail.com'}];

const findUserByLogin = (login) => {
    return Users.find((element)=> {
        return element.login == login;
    })
}

const findUserByEmail = (email) => {
    return Users.find((element)=> {
        return element.email.toLowerCase() == email.toLowerCase();
    })
}

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new YandexStrategy({
    clientID: 'YOUR_ID_YANDEX',
    clientSecret: 'YOUR_SECRET_KEY_YANDEX',
    callbackURL: "http://localhost:8081/auth/yandex/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);

    done(true, null);
  }
));

passport.use(new GoogleStrategy({
    clientID: "YOUR_ID_GOOGLE",
    clientSecret: "YOUR_SECRET_KEY_GOOGLE",
    callbackURL: "http://localhost:8081/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);

     done(true, null);
    }
));

const isAuth = (req, res, next)=> {
    if (req.isAuthenticated()) return next();

    res.redirect('/sorry');
}


app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'main.html'));
});
app.get('/sorry', (req, res)=> {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});
app.get('/auth/yandex', passport.authenticate('yandex'));

app.get('/auth/yandex/callback', 
	passport.authenticate('yandex', {
		failureRedirect: '/sorry',
		successRedirect: '/private' 
}));

app.get('/auth/google',
  passport.authenticate('google', { 
	scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ]}
));

app.get( '/auth/google/callback', 
    passport.authenticate( 'google', { 
        successRedirect: '/private',
        failureRedirect: '/sorry'
}));

app.get('/private', isAuth, (req, res)=>{
    res.send("<h2>Success!</h2>" + 
    	     "<h4>login: " + req.user.login + "</h4>" +
    	     "<h4>email: " + req.user.email + "</h4>" +
    	     "<h4>raw data: </h4>" + JSON.stringify(req.user));
});

app.listen(port, () => console.log(`App listening on port ${port}!`))