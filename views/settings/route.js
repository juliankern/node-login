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
            if (req.body.removeimage) {
                if (!(await user.update(req.user.id, { imageFilename: undefined, imageExt: undefined }, req.user))) {
                    global.error('Image could not be removed');
                }

                return res.redirect('/' + res.__('path.settings.base:settings'));
            }

            req.body = removeUnchangedParams(req.body, req.user, req.user);

            var updatedUser = await user.update(req.user.id, req.body, req.user);
            
            if(updatedUser.errors && updatedUser.errors.length > 0) {
                req.arrayFlash(updatedUser.errors, 'error');
            } else {
                var upload;

                if (req.files) {
                    upload = await user.image(req.user.id, req.files.image);
                } 
                    
                if ((req.files && upload) || !req.files) {
                    req.flash('success', { message: res.__('route.settings.success:Daten erfolgreich gespeichert!') });
                } else {
                    req.flash('error', { message: res.__('route.settings.imageerror:Fehler beim Bildupload!') });
                }
            }

            res.redirect('/' + res.__('path.settings.base:settings'));
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

            if (req.body.removeimage) {
                if (!(await user.update(victim.id, { imageFilename: undefined, imageExt: undefined }, req.user))) {
                    global.error('Image could not be removed');
                }

                return res.redirect('/' + res.__('path.settings.base:settings') + '/' + victim.username);
            }

            req.body = removeUnchangedParams(req.body, req.user, victim);

            var updatedUser = await user.update(victim.id, req.body, req.user);
            
            if(updatedUser.errors && updatedUser.errors.length > 0) {
                req.arrayFlash(updatedUser.errors, 'error');
            } else {
                var upload;

                if (req.files) {
                    upload = await user.image(victim.id, req.files.image);
                } 
                    
                if ((req.files && upload) || !req.files) {
                    req.flash('success', { message: res.__('route.settings.success:Daten erfolgreich gespeichert!') });
                } else {
                    req.flash('error', { message: res.__('route.settings.imageerror:Fehler beim Bildupload!') });
                }
            }

            res.redirect('/' + res.__('path.settings.base:settings') + '/' + updatedUser.username);
        });
}];

function removeUnchangedParams(data, user, victim) {
    if (data.pass === '') {
        delete data.pass;
        delete data.pass2;
    }

    if (data.confirmed === '') {
        delete data.confirmed;
    }

    if (victim.email === data.email) {
        delete data.email;
    }

    if (victim.username === data.username) {
        delete data.username;
    }

    if (victim._roleId !== +data.role && user.hasRight('user.edit.all.role')) {
        data._roleId = data.role;
    }
    delete data.role;

    return data;
}