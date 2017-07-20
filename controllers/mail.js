const config = global.req('config.json');

const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

module.exports = {
    newUser: (res, data) => {
        return transporter.sendMail({
            from: config.mail.from, // sender address
            to: data.email, // list of receivers
            subject: res.__('mail.newuser.headline:Hallo bei node-login!'), // Subject line
            html: res.__(`mail.newuser.text:Hallo %s!<br /><br />
Um deinen Account zu aktivieren, klicke bitte <a href="%s/activate/%s">hier</a>!<br />
Falls dieser Link nicht funkioniert, gebe bitte diesen Aktivierungscode (ohne Anführungszeichen) auf der folgenden Seite ein: "%3$s"<br>
%2$s/activate<br /><br />
Danke für deine Registrierung!`, data.username, config.url, data.confirmationCode) // html body
        }).catch((error) => {
            if (error) { return console.log(error); }
        });
    },
    passwordRequest: (res, data) => {
        return transporter.sendMail({
            from: config.mail.from, // sender address
            to: victim.email, // list of receivers
            subject: res.__('mail.resetpassword.headline:Du möchtest dein Passwort zurücksetzen?'), // Subject line
            html: res.__(`mail.resetpassword.text:Hallo %s!<br /><br />
Um deinen Passwort zurück zu setzen, klicke bitte <a href="%s/forgot/%s">hier</a>!<br />
Falls dieser Link nicht funkioniert, kopiere ihn bitte in deinen Browser: %2$s/forgot/%3$s<br /><br />`, data.username, config.url, data.passwordRequestCode) // html body
        }).catch((error) => {
            if (error) { return console.log(error); }
        });
    }
}