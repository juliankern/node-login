var user = require('../controllers/user.js');
var security = require('../controllers/security');

module.exports = (app) => {
    app.get('/settings', security.isLoggedin, (req, res) => {
        if (res.locals.messages.error && res.locals.messages.error.length > 0) {
            res.locals.fields = [];
            res.locals.messages.error.forEach((err) => {
                res.locals.fields = res.locals.fields.concat(err.fields);
            });
        }

        res.render('settings', {
            victim: req.user
        });
    });
    
    app.post('/settings', async (req, res) => {
        if (req.body.pass === '') {
            delete req.body.pass;
            delete req.body.pass2;
        }

        if (req.user.email === req.body.email) {
            delete req.body.email;
        }

        if (req.user.username === req.body.username) {
            delete req.body.username;
        }

        if (req.user._roleId === +req.body.role) {
            delete req.body.role;
        }
        
        var userdata = await user.validate(req.body);

        console.log('user settings', userdata);

        if(userdata.errors) {
            userdata.errors.forEach((err) => {
                req.flash('error', err);
            });

            req.flash('form', req.body);

            res.redirect('/settings');
        } else {
            var updatedUser = await user.update(req.user.id, userdata);
            
            if(updatedUser.errors && updatedUser.errors.length > 0) {
                updatedUser.errors.forEach((err) => {
                    req.flash('error', err);
                });
                
                req.flash('form', req.body);
            } else {
                req.flash('success', { message: 'Daten erfolgreich gespeichert!' });
            }

            res.redirect('/settings');
        }

        console.log('save settings', req.user, userdata);
    });
}