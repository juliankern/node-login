const user = global.req('controllers/user');
const mail = global.req('controllers/mail');
const security = global.req('controllers/security');

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
            
            let victim = await user.find([{ username: req.body.userdata }, { email: req.body.userdata }]);
            
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

            return res.redirect('/' + res.__('path.forgot.base:forgot'));
        });

    code
        .get(async (req, res) => {            
            res.render('forgot/template', {
                headline: res.__('route.forgot.headline:Passwort vergessen'),
                step2: true
            });
        })
        .post(async (req, res) => {
            // definitely check pass here, as it needs to be filled
            let userdata = await user.validate(req.body, {
                check: 'pass'
            });
            
            if(userdata.errors) {
                req.arrayFlash(userdata.errors, 'error');
                
                return res.redirect('/' + res.__('path.forgot.base:forgot') + '/' + req.params.code);
            } else {
                let victim = await user.find({ passwordRequestCode: req.params.code });
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