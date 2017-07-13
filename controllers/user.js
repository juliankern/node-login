const config = require('../config.json');

const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');

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
            errors.push({ fields: ['username'], message: 'Bitte geben Sie einen Benutzernamen an' });
        }
        
        if (data.username && data.username.length < 5) {
            errors.push({ fields: ['pass'], message: 'Der Benutzername muss mindestens fünf Zeichen haben' });
        }

        if (data.username && (await User.find({ username: data.username })).length > 0) {
            errors.push({ fields: ['username'], message: 'Dieser Benutzername ist schon vergeben, bitte wählen Sie einen anderen' }); 
        }

        if (data.email && data.email == '') {
            errors.push({ fields: ['email'], message: 'Bitte geben Sie einen E-Mail Adresse an' });
        }

        if (data.email && !validator.email(data.email)) {
            errors.push({ fields: ['email'], message: 'Bitte geben Sie eine valide E-Mail Adresse an!' });
        }

        if (data.email && (await User.find({ email: data.email })).length > 0) {
            errors.push({ fields: ['email'], message: 'Diese E-Mail Adresse ist schon in Benutzung, bitte loggen Sie sich ein' }); 
        }
        
        if (data.pass && data.pass !== data.pass2) {
            errors.push({ fields: ['pass', 'pass2'], message: 'Das Passwort stimmt nicht mit der Wiederholung überein' });
        }
        
        if (data.pass && data.pass.length < 6) {
            errors.push({ fields: ['pass'], message: 'Das Passwort muss mindestens sechs Zeichen haben' });
        }

        if (data.pass && !validator.password(data.pass)) {
            errors.push({ fields: ['pass'], message: 'Ihr Password muss mindestens sechs Zeichen haben, und sowohl Buchstaben als auch Zahlen beinhalten!' });
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
                    html: 'Um deinen Account zu aktivieren, klicke <a href="http://localhost:3000/activate/' + confirmationCode + '">hier</a>!' // html body
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