var passport = require('passport');

module.exports = (route) => {
    route
        .get((req, res) => {
            res.render('login', { headline: res.__('Login') });
        })
        .post((req, res, next) => { 
            passport.authenticate('local', (err, user, info) => {
                if (err) { return next(err); }
                if (info) { req.flash('error', info); }
                if (!user) { return res.redirect('/login'); }
                
                req.logIn(user, function(err) {
                    if (err) { return next(err); }
                    return res.redirect('/');
                });
            })(req, res, next)
        }, 
        (req, res) => {
            if (req.body.remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
            } else {
                req.session.cookie.expires = false; // Cookie expires at end of session
            }
            
            if (req.query.redirect) {
                res.redirect(req.query.redirect);
            } else {
                res.redirect('/');
            }
        });
}