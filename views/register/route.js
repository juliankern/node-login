var user = global.req('controllers/user.js');
var mail = global.req('controllers/mail.js');

module.exports = (route) => {
    route
        .get((req, res) => {
            res.render('register/template', { headline: res.__('route.register.headline:Registrierung') });
        })
        .post(async (req, res) => {
            var newUser = await user.new(req.body, { new: true });
            
            if(newUser.errors && newUser.errors.length > 0) {
                req.arrayFlash(newUser.errors, 'error');
                
                res.redirect('/' + res.__('path.register.base:register')); 
            } else {
                if ((await mail.newUser(res, newUser))) {
                    req.flash('success', { message: res.__('route.register.success:Du wurdest erfolgreich registriert. Bitte bestätige deine E-Mail Adresse um dich einloggen zu können!') });
                }
                
                res.redirect('/' + res.__('path.login.base:login'));
            }
        });
}