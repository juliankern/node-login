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
        })
        .post(
            security.isLoggedin, 
            security.hasRight('user.create'),
        async (req, res) => {  
            var newUser = await user.create(req.body);
            
            if(newUser.errors && newUser.errors.length > 0) {
                req.arrayFlash(newUser.errors, 'error');
                
                res.redirect('/' + res.__('path.user.new:user/new')); 
            } else {
                if (!req.body.sendmail) {
                    req.flash('success', { message: res.__('route.user.success:Der neue Benutzer wurde erfolgreich angelegt') });
                } else if ((await mail.newUser(res, newUser))) {
                    req.flash('success', { message: res.__('route.user.successmail:Der neue Benutzer wurde erfolgreich angelegt, und ihm wurde eine Mail geschickt.') });
                }
                
                res.redirect('/' + res.__('path.user.base:user') + '/' + newUser.username);
            }
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