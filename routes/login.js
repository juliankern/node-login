var passport = require('passport');

module.exports = (route) => {
    route
        .get((req, res) => {
            res.render('login');
        })
        .post(passport.authenticate('local', { 
           failureRedirect: '/login',
           failureFlash: true 
        }), 
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