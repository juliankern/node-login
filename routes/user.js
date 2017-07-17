var user = require('../controllers/user.js');
var security = require('../controllers/security');

module.exports = ['/new', '/:username', (base, newUser, username) => {
    base
        .get(
            security.isLoggedin, 
        async (req, res) => {
            res.render('userlist', { 
                headline: res.__('Benutzer'),
                users: await user.get() 
            });
        });

    newUser
        .get(
            security.isLoggedin, 
            security.hasRight('user.create'), 
        async (req, res) => {
            res.render('settings', { 
                headline: res.__('Neuen Benutzer anlegen'),
                victim: {},
                newUser: true
            });
        });

    username
        .get(
            security.isLoggedin, 
        async (req, res) => {
            var victim = await user.get(req.params.username);

            res.render('profile', { 
                headline: res.__('Profil von %s', victim.username),
                victim 
            });
        });
}];