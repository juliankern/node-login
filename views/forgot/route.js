var user = require('../../controllers/user.js');
var mail = require('../../controllers/mail.js');
var security = require('../../controllers/security');

module.exports = ['/:code', (base, code) => {
    base
        .get((req, res) => {
            res.render('forgot/template', {
                headline: res.__('route.forgot.headline:Passwort vergessen')
            });
        })
        .post(async (req, res) => {
            if (!req.body.userdata) {
                req.flash('error', { message: res.__('route.forgot.error.empty:Bitte gebe deinen Benutzernamen oder E-Mail Adresse an!') });
                return res.redirect('/' + res.__('path.forgot.base:forgot'));
            }
            
            var victim = await user.find([{ username: req.body.userdata }, { email: req.body.userdata }]);
            
            if (!victim) {
                req.flash('error', { message: res.__('route.forgot.error.notfound:Es konnte kein Benutzer mit diesen Daten gefunden werden.') + ' ' + res.__('global.check.input:Bitte überprüfe deine Eingaben.') });
                return res.redirect('/' + res.__('path.forgot.base:forgot'));
            }
            
            if ((await user.passwordRequest(victim))) {
                if ((await mail.passwordRequest(res, victim))) {
                    req.flash('success', { message: res.__('route.forgot.success:Du erhältst nun eine E-Mail, mit der du dein Passwort ändern kannst.') });
                    return res.redirect('/' + res.__('path.login.base:login'));
                }
            }
            
            console.log('user found!', victim, req.body);
            return res.redirect('/' + res.__('path.forgot.base:forgot'));
        });

    code
        .get(async (req, res) => {
            if (res.locals.messages.error && res.locals.messages.error.length > 0) {
                res.locals.fields = [];
                res.locals.messages.error.forEach((err) => {
                    res.locals.fields = res.locals.fields.concat(err.fields);
                });
            }
            
            res.render('forgot/template', {
                headline: res.__('route.forgot.headline:Passwort vergessen'),
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
                
                return res.redirect('/' + res.__('path.forgot.base:forgot') + '/' + req.params.code);
            } else {
                var victim = await user.find({ passwordRequestCode: req.params.code });
                userdata.passwordRequestCode = undefined;
                
                if ((await user.update(victim.id, userdata))) {
                    req.flash('success', { message: res.__('route.forgot.success:Dein Passwort wurde erfolgreich geändert.') });
                    return res.redirect('/' + res.__('path.login.base:login'));
                }
                
                req.flash('error', { message: res.__('route.forgot.error:Es ist ein Fehler aufgetreten!') });
                return res.redirect('/' + res.__('path.forgot.base:forgot') + '/' + req.params.code);
            }
        });
}]