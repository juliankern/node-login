var validator = require('../utils/validation.js');
var bcrypt = require('bcrypt');
var config = require('../config.json');

var User = require('../models/user.js');

module.exports = {
    validate: async (data) => {
        var errors = [];

        console.log('validate user:', !!data.pass);
        
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
        
        var newUser = new User({
            email: data.email,
            username: data.username,
            pass: passHash
        });
          
        return await newUser.save((err) => {
            console.log('user save error:', err);
        });
    },
    update: async (userId, data) => {
        if (data.pass) {
            data.pass = await bcrypt.hash(data.pass, config.security.saltRounds);
        }

        return await User.findOneAndUpdate(userId, data).exec((err) => {
            console.log('user update error:', err);
        });
    }
}