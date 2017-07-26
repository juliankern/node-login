var user = global.req('controllers/user');
var security = global.req('controllers/security');

module.exports = ['/:username', (base, username) => {
    base
        .get(
            security.isLoggedin, 
            security.hasRight('user.edit.own'), 
        (req, res) => {
            res.render('settings/template', {
                headline: res.__('route.settings.headline:Einstellungen'),
                victim: req.user
            });
        })
        .post(
            security.isLoggedin, 
            security.hasRight('user.edit.own'), 
        async (req, res) => {
            if (await user.changeSettings(req.user.id, req)) {
                return res.redirect('/' + res.__('path.settings.base:settings'));
            }
        });

    username
        .get(
            security.isLoggedin,
            security.hasRight('user.edit.all'), 
        async (req, res) => {
            var victim = await user.get(req.params.username);

            if (await req.user.isEqual(victim)) {
                return res.redirect('/' + res.__('path.settings.base:settings'));
            }

            res.render('settings/template', {
                headline: res.__('route.settings.user.headline:Einstellungen für %s', victim.username),
                victim
            });
        })
        .post(
            security.isLoggedin,
            security.hasRight('user.edit.all'), 
        async (req, res) => {
            var updated = await user.changeSettings(req.params.username, req);

            if (updated) {
                return res.redirect('/' + res.__('path.settings.base:settings') + '/' + updated.username);
            }
        });
}];