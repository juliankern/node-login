const passport = require('passport');
const bcrypt = require('bcrypt');
const i18n = require('i18n');

const LocalStrategy = require('passport-local').Strategy;

const User = global.req('models/user.js');
  
module.exports = {
    init: (app) => {
        app.use(require('express-session')({
            secret: 'keyboard cat',
            cookie: app.get('env') === 'production' ? { secure: true } : {},
            saveUninitialized: false,
            resave: true
        }));
        
        app.use(passport.initialize());
        app.use(passport.session());

        passport.use(new LocalStrategy({
                usernameField: 'email',
                passwordField: 'pass'
            }, (email, pass, done) => {
                User.findOne({ email }, async (err, user) => {
                    if (err) { return done(err); }
                    
                    if (!user) {
                        return done(null, false, { messageTranslate: 'security.error.username:Falscher Benutzername.' });
                    }
                    
                    if (!(await bcrypt.compare(pass, user.pass))) {
                        return done(null, false, { messageTranslate: 'security.error.password:Falsches Passwort.' });
                    }
                    
                    if(!user.confirmed) {
                        return done(null, false, { messageTranslate: 'security.error.confirmed:Deine E-Mail Adresse wurde noch nicht bestätigt.' });
                    } 
                    
                    if(!user.active) {
                        return done(null, false, { messageTranslate: 'security.error.active:Deine Account wurde deaktiviert.' });
                    }
                    
                    return done(null, user);
                });
            }
        ));

        passport.serializeUser(function(user, done) {
            done(null, user._id);
        });

        passport.deserializeUser(function(id, done) {
            User.findById(id, function(err, user) {
                done(err, user);
            });
        });
    },
    isLoggedin: (req, res, next) => {
        if (req.isAuthenticated()) {
            next();
        } else {
            req.flash('error', { message: res.__('security.error.loggedin:Du darfst diese Seite nicht besuchen, bitte logge dich zuerst ein! [Code: 1]') });
            res.redirect('/login?redirect=' + encodeURIComponent(req.url).replace(/http(s*):\/\//g, ''));
        }
    },
    isNotLoggedin: (req, res, next) => {
        if (!req.isAuthenticated()) {
            next();
        } else {
            req.flash('error', { message: res.__('security.error.notloggedin:Du darfst diese Seite nicht besuchen, bitte logge dich zuerst aus! [Code: 4]') });
            res.redirect('/');
        }
    },
    hasRight: (right) => {
        return (req, res, next) => {
            if (req.user.hasRight(right)) {
                next();
            } else {
                if (req.isAuthenticated()) {
                    req.flash('error', { message: res.__('security.error.right:Du darfst diese Seite nicht besuchen. [Code: 3]') });
                    res.redirect('/');
                } else {
                    req.flash('error', { message: res.__('security.error.loginright:Du darfst diese Seite nicht besuchen, bitte logge dich zuerst ein! [Code: 2]') });
                    res.redirect('/login?redirect=' + encodeURIComponent(req.url).replace(/http(s*):\/\//g, ''));
                }
            }
        }
    }
}
  