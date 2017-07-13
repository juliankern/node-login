var user = require('../controllers/user.js');
var security = require('../controllers/security');

module.exports = ['/:code', (base, code) => {
    code
        .get(async (req, res) => {
            if (!(await user.confirm(req.params.code))) {
                req.flash('error', { message: 'Dein Account konnte nicht bestätigt werden' })
            } else {
                req.flash('success', { message: 'Dein Account wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.' })
            }
            
            res.redirect('/login');
        });
}];