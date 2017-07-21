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
            if (req.body.pass === '') {
                delete req.body.pass;
                delete req.body.pass2;
            }

            if (req.user.email === req.body.email) {
                delete req.body.email;
            }

            if (req.user.username === req.body.username) {
                delete req.body.username;
            }

            if (req.user._roleId !== +req.body.role && req.user.hasRight('user.edit.own.role')) {
                req.body._roleId = req.body.role;
            }
            delete req.body.role;

            var userdata = await user.validate(req.body); 

            if(userdata.errors) {
                userdata.errors.forEach((err) => {
                    req.flash('error', err);
                });

                req.flash('form', req.body);

                res.redirect('/' + res.__('path.settings.base:settings'));
            } else {
                var updatedUser = await user.update(req.user.id, userdata);
                
                if(updatedUser.errors && updatedUser.errors.length > 0) {
                    updatedUser.errors.forEach((err) => {
                        req.flash('error', err);
                    });
                    
                    req.flash('form', req.body);
                } else {
                    req.flash('success', { message: res.__('route.settings.success:Daten erfolgreich gespeichert!') });
                }

                res.redirect('/' + res.__('path.settings.base:settings'));
            };
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
            var victim = await user.get(req.params.username);

            if (req.body.pass === '') {
                delete req.body.pass;
                delete req.body.pass2;
            }

            if (victim.email === req.body.email) {
                delete req.body.email;
            }

            if (victim.username === req.body.username) {
                delete req.body.username;
            }

            if (victim._roleId !== +req.body.role && req.user.hasRight('user.edit.all.role')) {
                req.body._roleId = req.body.role;
            }
            delete req.body.role;

            var userdata = await user.validate(req.body); 

            if(userdata.errors) {
                userdata.errors.forEach((err) => {
                    req.flash('error', err);
                });

                req.flash('form', req.body);

                res.redirect('/' + res.__('path.settings.base:settings') + '' + victim.username);
            } else {
                var updatedUser = await user.update(victim.id, userdata);
                
                if(updatedUser.errors && updatedUser.errors.length > 0) {
                    updatedUser.errors.forEach((err) => {
                        req.flash('error', err);
                    });
                    
                    req.flash('form', req.body);
                } else {
                    req.flash('success', { message: res.__('route.settings.success:Daten erfolgreich gespeichert!') });
                }

                res.redirect('/' + res.__('path.settings.base:settings') + '/' + victim.username);
            }
        });
}]