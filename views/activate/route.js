var user = require('../../controllers/user.js');
var security = require('../../controllers/security');

module.exports = ['/:code', (base, code) => {
    base
        .get((req, res) => {
            res.render('activate/template', { headline: res.__('route.activate.headline:Aktivierung') });
        })
        .post((req, res) => {
            if (!req.body.code) {
                req.flash('error', { message: res.__('route.activate.error:Du musst deinen Aktivierungscode eingeben!') });

                res.redirect('/' + res.__('path.activate.base:activate'));
            } else {
                res.redirect('/' + res.__('path.activate.base:activate') + '/' + req.body.code);
            }
        });

    code
        .get(async (req, res) => {
            if (!(await user.confirm(req.params.code))) {
                req.flash('error', { message: res.__('route.activate.code.error:Dein Account konnte nicht bestätigt werden! Stelle bitte sicher, dass du den Code korrekt eingegeben hast') });
                res.redirect('/' + res.__('path.activate.base:activate'));
            } else {
                req.flash('success', { message: res.__('route.activate.code.success:Dein Account wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.') })
                res.redirect('/' + res.__('path.login.base:login'));
            }
            
        });
}];