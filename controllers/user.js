const config = require('../config.json');

const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const i18n = require("i18n");

var validator = require('../utils/validation.js');

var User = require('../models/user.js');

let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function getConfirmationCode() {
    var code;
    
    while(true) {
        code = randomstring.generate({ length: 32, readable: true });
        if ((await User.find({ confirmationCode: code })).length === 0) {
            break;
        }
    }
    
    return code;
}

module.exports = {
    confirm: async (code) => {
        var user = await User.findOne({ confirmationCode: code, confirmed: false });
        
        if (!user) {
            return false;
        }
        
        user.confirmed = true;
        
        return await user.save((err) => {
           if (err) { console.log('user confirm error:', err); } 
        });
    },
    validate: async (data) => {
        var errors = [];
        
        if (data.username && data.username == '') {
            errors.push({ fields: ['username'], message: i18n.__('Bitte geben Sie einen Benutzernamen an') });
        }
        
        if (data.username && data.username.length < 5) {
            errors.push({ fields: ['pass'], message: i18n.__('Der Benutzername muss mindestens fünf Zeichen haben') });
        }

        if (data.username && (await User.find({ username: data.username })).length > 0) {
            errors.push({ fields: ['username'], message: i18n.__('Dieser Benutzername ist schon vergeben, bitte wählen Sie einen anderen') }); 
        }

        if (data.email && data.email == '') {
            errors.push({ fields: ['email'], message: i18n.__('Bitte geben Sie einen E-Mail Adresse an') });
        }

        if (data.email && !validator.email(data.email)) {
            errors.push({ fields: ['email'], message: i18n.__('Bitte geben Sie eine valide E-Mail Adresse an!') });
        }

        if (data.email && (await User.find({ email: data.email })).length > 0) {
            errors.push({ fields: ['email'], message: i18n.__('Diese E-Mail Adresse ist schon in Benutzung, bitte loggen Sie sich ein') }); 
        }
        
        if (data.pass && data.pass !== data.pass2) {
            errors.push({ fields: ['pass', 'pass2'], message: i18n.__('Das Passwort stimmt nicht mit der Wiederholung überein') });
        }
        
        if (data.pass && data.pass.length < 6) {
            errors.push({ fields: ['pass'], message: i18n.__('Das Passwort muss mindestens sechs Zeichen haben') });
        }

        if (data.pass && !validator.password(data.pass)) {
            errors.push({ fields: ['pass'], message: i18n.__('Ihr Password muss mindestens sechs Zeichen haben, und sowohl Buchstaben als auch Zahlen beinhalten!') });
        }

        return await Object.assign({}, data, { errors: errors.length > 0 ? errors : null });
    },
    new: async (data) => {
        var errors = [];
        
        var passHash = await bcrypt.hash(data.pass, config.security.saltRounds);
        var confirmationCode = await getConfirmationCode();
        
        var newUser = new User({
            email: data.email,
            username: data.username,
            pass: passHash,
            confirmationCode
        });
          
        return await newUser.save((err) => {
            console.log('user save error:', err);
            
            if (!err) {
                transporter.sendMail({
                    from: config.mail.from, // sender address
                    to: data.email, // list of receivers
                    subject: 'Hallo bei node-login!', // Subject line
                    html: `Hallo ${data.username}!<br /><br />
                    Um deinen Account zu aktivieren, klicke bitte <a href="${config.url}/activate/' + confirmationCode + '">hier</a>!<br />
                    Falls dieser Link nicht funkioniert, gebe bitte diesen Aktivierungscode (ohne Anführungszeichen) auf der folgenden Seite ein: "&{confirmationCode}"<br>
                    ${config.url}<br /><br />
                    Danke für deine Registrierung!` // html body
                }, (error, info) => {
                    if (error) { return console.log(error); }
                    console.log('Message %s sent: %s', info.messageId, info.response);
                });
            }
        });
    },
    update: async (userId, data) => {
        if (data.pass) {
            data.pass = await bcrypt.hash(data.pass, config.security.saltRounds);
        }

        return await User.findOneAndUpdate(userId, data).exec((err) => {
            console.log('user update error:', err);
        });
    },
    get: async (username) => {
        if (!username) {
            return await User.find(); // show all for debug
            // return await User.where('_roleId').ne(9); // skip root user
        } else {
            return await User.findOne({ username: username });
        }
    }
}