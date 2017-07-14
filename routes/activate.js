var user = require('../controllers/user.js');
var security = require('../controllers/security');

module.exports = ['/:code', (base, code) => {
    base
        .get((req, res) => {
            res.render('activate', { headline: res.__('Aktivierung') });
        })
        .post((req, res) => {
            if (!req.body.code) {
                req.flash('error', { message: res.__('Du musst deinen Aktivierungscode eingeben!') });

                res.redirect('/activate');
            } else {
                res.redirect('/activate/' + req.body.code);
            }
        });

    code
        .get(async (req, res) => {
            if (!(await user.confirm(req.params.code))) {
                req.flash('error', { message: res.__('Dein Account konnte nicht bestätigt werden! Stelle bitte sicher, dass du den Code korrekt eingegeben hast') });
                res.redirect('/activate');
            } else {
                req.flash('success', { message: res.__('Dein Account wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.') })
                res.redirect('/login');
            }
            
        });
}];