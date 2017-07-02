var passport = require('passport');

module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.post('/login', passport.authenticate('local', { 
       failureRedirect: '/login',
       successRedirect: '/',
       failureFlash: true 
    }));
}