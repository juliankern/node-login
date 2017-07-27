const user = global.req('controllers/user');
const mail = global.req('controllers/mail');

module.exports = (route) => {
    route
        .get((req, res) => {
            res.render('register/template', { headline: res.__('route.register.headline:Registrierung') });
        })
        .post(async (req, res) => {
            let newUser = await user.create(req.body, { new: true });
            
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