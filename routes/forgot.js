var user = require('../controllers/user.js');
var mail = require('../controllers/mail.js');
var security = require('../controllers/security');

module.exports = ['/:code', (base, code) => {
    base
        .get((req, res) => {
            res.render('forgot', {
                headline: res.__('Passwort vergessen')
            });
        })
        .post(async (req, res) => {
            if (!req.body.userdata) {
                req.flash('error', { message: res.__('Bitte gebe deinen Benutzernamen oder E-Mail Adresse an!') });
                return res.redirect('/forgot');
            }
            
            var victim = await user.find([{ username: req.body.userdata }, { email: req.body.userdata }]);
            
            if (!victim) {
                req.flash('error', { message: res.__('Es konnte kein Benutzer mit diesen Daten gefunden werden.') + ' ' + res.__('Bitte überprüfe deine Eingaben.') });
                return res.redirect('/forgot');
            }
            
            if ((await user.passwordRequest(victim))) {
                if ((await mail.passwordRequest(res, victim))) {
                    req.flash('success', { message: res.__('Du erhältst nun eine E-Mail, mit der du dein Passwort ändern kannst.') });
                    return res.redirect('/login');
                }
            }
            
            console.log('user found!', victim, req.body);
            return res.redirect('/forgot');
        });

    code
        .get(async (req, res) => {
            if (res.locals.messages.error && res.locals.messages.error.length > 0) {
                res.locals.fields = [];
                res.locals.messages.error.forEach((err) => {
                    res.locals.fields = res.locals.fields.concat(err.fields);
                });
            }
            
            res.render('forgot', {
                headline: res.__('Passwort vergessen'),
                step2: true
            });
        })
        .post(async (req, res) => {
            req.body.pass = req.body.pass || ' '; // ensure ists filled and gets checked
            var userdata = await user.validate(req.body);
            
            if(userdata.errors) {
                userdata.errors.forEach((err) => {
                    req.flash('error', err);
                });
                
                return res.redirect('/forgot/' + req.params.code);
            } else {
                var victim = await user.find({ passwordRequestCode: req.params.code });
                userdata.passwordRequestCode = undefined;
                
                if ((await user.update(victim.id, userdata))) {
                    req.flash('success', { message: res.__('Dein Passwort wurde erfolgreich geändert.') });
                    return res.redirect('/login');
                }
                
                req.flash('error', { message: res.__('Es ist ein Fehler aufgetreten!') });
                return res.redirect('/forgot/' + req.params.code);
            }
        });
}]