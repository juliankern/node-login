var user = require('../controllers/user.js');
var security = require('../controllers/security');

module.exports = (app) => {
    app.get('/settings', security.isLoggedin, (req, res) => {
        res.render('settings', {
            user: req.user
        });
    });
    
    app.post('/settings', async (req, res) => {
        if (req.body.pass === '') {
            delete req.body.pass;
            delete req.body.pass2;
        }
        
        var userdata = user.validate(req.body);

        if(userdata.errors) {
            userdata.errors.forEach((err) => {
                req.flash('error', err);
            });

            req.flash('form', req.body);

            res.redirect('/settings');
        } else {
        
        }

        console.log('save settings', req.user, userdata);
    });
}