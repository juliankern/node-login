const passport = require('passport');

module.exports = (route) => {
    route
        .get((req, res) => {
            res.render('login/template', { headline: res.__('route.login.headline:Login') });
        })
        .post((req, res, next) => { 
            passport.authenticate('local', (err, user, info) => {
                if (err) { return next(err); }
                if (info) { req.flash('error', info); }
                if (!user) { return res.redirect('/' + res.__('path.login.base:login')); }
                
                req.logIn(user, function(err) {
                    if (err) { return next(err); }

                    if (req.body.remember) {
                        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
                    } else {
                        req.session.cookie.expires = false; // Cookie expires at end of session
                    }

                    if (req.query.redirect) {
                        res.redirect(decodeURIComponent(req.query.redirect).replace(/http(s*):\/\//g, ''));
                    } else {
                        res.redirect('/');
                    }
                });
            })(req, res, next)
        });
};