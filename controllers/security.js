var passport = require('passport');
var bcrypt = require('bcrypt');
var i18n = require('i18n');

var config = require('../config.json');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user.js');

  
module.exports = {
    init: (app) => {
        app.use(passport.initialize());
        app.use(passport.session());

        passport.use(new LocalStrategy({
                usernameField: 'email',
                passwordField: 'pass'
            }, (email, pass, done) => {
                User.findOne({ email }, async (err, user) => {
                    if (err) { return done(err); }
                    
                    if (!user) {
                        return done(null, false, { message: i18n.__('security.error.username:Falscher Benutzername.') });
                    }
                    
                    if (!(await bcrypt.compare(pass, user.pass))) {
                        return done(null, false, { message: i18n.__('security.error.password:Falsches Passwort.') });
                    }
                    
                    if(!user.confirmed) {
                        return done(null, false, { message: i18n.__('security.error.confirmed:Deine E-Mail Adresse wurde noch nicht bestätigt.') });
                    } 
                    
                    if(!user.active) {
                        return done(null, false, { message: i18n.__('security.error.active:Deine Account wurde deaktiviert.') });
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
  