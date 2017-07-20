const config = global.req('config.json');

const bcrypt = require('bcrypt');
const randomstring = require('randomstring');

var validator = global.req('utils/validation');
var security = global.req('controllers/security');

var User = global.req('models/user.js');

async function getCode(fieldname) {
    var code;
    var find = {};
    
    while(true) {
        code = randomstring.generate({ length: 32, readable: true });
        find[fieldname] = code;
        if ((await User.find(find)).length === 0) {
            break;
        }
    }
    
    return code;
}

module.exports = {
    find: async (conditions) => {
        return await User.findOne().or(conditions);
    },
    passwordRequest: async (victim) => {
        var passwordRequestCode = await getCode('passwordRequestCode');
        victim.passwordRequestCode = passwordRequestCode;
        
        return await victim.save((err) => {
           if (err) { console.log('user passwordRequest error:', err); } 
        });
    },
    confirm: async (code) => {
        var user = await User.findOne({ confirmationCode: code, confirmed: false });
        
        if (!user) {
            return false;
        }
        
        user.confirmed = true;
        user.confirmationCode = undefined;
        
        return await user.save((err) => {
           if (err) { console.log('user confirm error:', err); } 
        });
    },
    validate: async (data) => {
        var errors = [];
        
        if (data.username && data.username == '') {
            errors.push({ fields: ['username'], messageTranslate: 'user.validate.username.empty:Bitte geben Sie einen Benutzernamen an' });
        }
        
        if (data.username && data.username.length < 5) {
            errors.push({ fields: ['pass'], messageTranslate: 'user.validate.username.length:Der Benutzername muss mindestens fünf Zeichen haben' });
        }

        if (data.username && (await User.find({ username: data.username })).length > 0) {
            errors.push({ fields: ['username'], messageTranslate: 'user.validate.username.used:Dieser Benutzername ist schon vergeben, bitte wählen Sie einen anderen' }); 
        }

        if (data.email && data.email == '') {
            errors.push({ fields: ['email'], messageTranslate: 'user.validate.email.empty:Bitte geben Sie einen E-Mail Adresse an' });
        }

        if (data.email && !validator.email(data.email)) {
            errors.push({ fields: ['email'], messageTranslate: 'user.validate.email.valid:Bitte geben Sie eine valide E-Mail Adresse an!' });
        }

        if (data.email && (await User.find({ email: data.email })).length > 0) {
            errors.push({ fields: ['email'], messageTranslate: 'user.validate.email.used:Diese E-Mail Adresse ist schon in Benutzung, bitte loggen Sie sich ein' }); 
        }
        
        if (data.pass && data.pass !== data.pass2) {
            errors.push({ fields: ['pass', 'pass2'], messageTranslate: 'user.validate.password.repeat:Das Passwort stimmt nicht mit der Wiederholung überein' });
        }
        
        if (data.pass && data.pass.length < 6) {
            errors.push({ fields: ['pass'], messageTranslate: 'user.validate.password.length:Das Passwort muss mindestens sechs Zeichen haben' });
        }

        if (data.pass && !validator.password(data.pass)) {
            errors.push({ fields: ['pass'], messageTranslate: 'user.validate.password.valid:Ihr Password muss mindestens sechs Zeichen haben, und sowohl Buchstaben als auch Zahlen beinhalten!' });
        }

        // TODO check for rights here, and prevnt change of role

        return await Object.assign({}, data, { errors: errors.length > 0 ? errors : null });
    },
    new: async (data) => {
        var passHash = await bcrypt.hash(data.pass, config.security.saltRounds);
        var confirmationCode = await getCode('confirmationCode');
        
        var newUser = new User({
            email: data.email,
            username: data.username,
            pass: passHash,
            confirmationCode
        });
          
        return await newUser.save((err) => {
            console.log('user save error:', err);
        });
    },
    update: async (userId, data) => {
        if (data.pass) {
            data.pass = await bcrypt.hash(data.pass, config.security.saltRounds);
        }

        return await User.findByIdAndUpdate(userId, data).exec((err, data) => {
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