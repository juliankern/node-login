var user = require('../controllers/user.js');

module.exports = (route) => {
    route
        .get((req, res) => {
            if (res.locals.messages.error && res.locals.messages.error.length > 0) {
                res.locals.fields = [];
                res.locals.messages.error.forEach((err) => {
                    res.locals.fields = res.locals.fields.concat(err.fields);
                });
            }

            res.render('register', { headline: res.__('Registrierung') });
        })
        .post(async (req, res) => {
            var userdata = await user.validate(req.body);

            if(userdata.errors) {
                userdata.errors.forEach((err) => {
                    req.flash('error', err);
                });

                req.flash('form', req.body);

                res.redirect('/register');
            } else {
                var newUser = await user.new(userdata);
                
                if(newUser.errors && newUser.errors.length > 0) {
                    newUser.errors.forEach((err) => {
                        req.flash('error', err);
                    });
                    
                    req.flash('form', req.body);
                    
                    res.redirect('/register'); 
                } else {
                    req.flash('success', { message: res.__('Du wurdest erfolgreich registriert. Bitte bestätige deine E-Mail Adresse um dich einloggen zu können!') });
                    
                    res.redirect('/login');
                }
            }
        });
}