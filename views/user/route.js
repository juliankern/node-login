var user = global.req('controllers/user');
var security = global.req('controllers/security');

module.exports = ['/new', '/:username', (base, newUser, username) => {
    base
        .get(
            security.isLoggedin, 
        async (req, res) => {
            res.render('userlist/template', { 
                headline: res.__('route.user.list.headline:Benutzer'),
                users: await user.get() 
            });
        });

    newUser
        .get(
            security.isLoggedin, 
            security.hasRight('user.create'), 
        async (req, res) => {
            res.render('settings/template', { 
                headline: res.__('route.user.new.headline:Neuen Benutzer anlegen'),
                victim: {},
                newUser: true
            });
        });

    username
        .get(
            security.isLoggedin, 
        async (req, res) => {
            var victim = await user.get(req.params.username);

            res.render('profile/template', { 
                headline: res.__('route.user.profile.headline:Profil von %s', victim.username),
                victim 
            });
        });
}];