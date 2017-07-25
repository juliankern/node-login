const config = global.req('config.json');

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const randomstring = require('randomstring');

var validator = global.req('utils/validation');
var security = global.req('controllers/security');

var User = global.req('models/user.js');

module.exports = {
    find,
    passwordRequest,
    confirm,
    validate,
    new: create,
    update,
    get,
    image
};

/**
 * find specific user
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} conditions Array of objects for OR handling or object for AND
 *
 * @return {Promise}           Promise returning the found User
 */
async function find(conditions) {
    return await User.findOne().or(conditions);
}

/**
 * Sets the passwordPrequestCode on the victom
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} victim Victom to start the request
 *
 * @return {Promise}       Promise returning the user
 */
async function passwordRequest(victim) {
    var passwordRequestCode = await _getCode('passwordRequestCode');
    victim.passwordRequestCode = passwordRequestCode;
    
    return await victim.save((err) => {
       if (err) { global.error('User passwordRequest error:', err); } 
    });
}

/**
 * Sets a user as confirmed
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} code The confirmation code
 *
 * @return {Promise}     Promise returning the just confirmed user
 */
async function confirm(code) {
    var user = await User.findOne({ confirmationCode: code, confirmed: false });
    
    if (!user) {
        return false;
    }
    
    user.confirmed = true;
    user.confirmationCode = undefined;
    
    return await user.save((err) => {
       if (err) { global.error('User confirm error:', err); } 
    });
}

/**
 * Validate userdata
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} data    Form data
 * @param  {object} options Options for the check. Currently possible:
 *                          - check: {Array}    containing the field names which should definitely be checked, even if not set
 *
 * @return {object}         Object containung the original data and errors if occured
 */
async function validate(data, options) {
    var errors = [];
    options = options || { check: '' };
    
    if ((data.username || options.check.includes('username')) && data.username == '') {
        errors.push({ fields: ['username'], messageTranslate: 'user.validate.username.empty:Bitte geben Sie einen Benutzernamen an' });
    }
    
    if ((data.username || options.check.includes('username')) && data.username.length < 5) {
        errors.push({ fields: ['pass'], messageTranslate: 'user.validate.username.length:Der Benutzername muss mindestens fünf Zeichen haben' });
    }

    if ((data.username || options.check.includes('username')) && (await User.find({ username: data.username })).length > 0) {
        errors.push({ fields: ['username'], messageTranslate: 'user.validate.username.used:Dieser Benutzername ist schon vergeben, bitte wählen Sie einen anderen' }); 
    }

    if ((data.email || options.check.includes('email')) && data.email == '') {
        errors.push({ fields: ['email'], messageTranslate: 'user.validate.email.empty:Bitte geben Sie einen E-Mail Adresse an' });
    }

    if ((data.email || options.check.includes('email')) && !validator.email(data.email)) {
        errors.push({ fields: ['email'], messageTranslate: 'user.validate.email.valid:Bitte geben Sie eine valide E-Mail Adresse an!' });
    }

    if ((data.email || options.check.includes('email')) && (await User.find({ email: data.email })).length > 0) {
        errors.push({ fields: ['email'], messageTranslate: 'user.validate.email.used:Diese E-Mail Adresse ist schon in Benutzung, bitte loggen Sie sich ein' }); 
    }
    
    if ((data.pass || options.check.includes('pass')) && data.pass !== data.pass2) {
        errors.push({ fields: ['pass', 'pass2'], messageTranslate: 'user.validate.password.repeat:Das Passwort stimmt nicht mit der Wiederholung überein' });
    }
    
    if ((data.pass || options.check.includes('pass')) && data.pass.length < 6) {
        errors.push({ fields: ['pass'], messageTranslate: 'user.validate.password.length:Das Passwort muss mindestens sechs Zeichen haben' });
    }

    if ((data.pass || options.check.includes('pass')) && !validator.password(data.pass)) {
        errors.push({ fields: ['pass'], messageTranslate: 'user.validate.password.valid:Ihr Password muss mindestens sechs Zeichen haben, und sowohl Buchstaben als auch Zahlen beinhalten!' });
    }

    // TODO check for rights here, and prevnt change of role

    return await Object.assign({}, data, { errors: errors.length > 0 ? errors : null });
}

/**
 * gets the uploaded image and sets it to the user
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} userId Id of the user
 * @param  {object} image  Image to be uploaded/moved
 *
 * @return {Promise}       Promise returning if the update was successful
 */
async function image(userId, image) {
    return new Promise((resolve, reject) => {
        var ext = image.name.split('.').pop();
        var file = _getFileName(global.approot + config.app.uploads, ext) + '.' + ext;
        var filepath = path.resolve(global.approot + config.app.uploads + file);

        image.mv(filepath, async (err) => {
            if (err) return reject(err);

            if((await update(userId, { imageFilename: file })).image) {
                resolve(true);
            } else {
                reject();
            }
        })
    });
}

/**
 * Creates new user
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} data Userdata for the new user
 *
 * @return {Promise}     Promise returning the created user
 */
async function create(data) {
    // definitely check all fields, as they need to be filled
    var userdata = await validate(data, {
        check: [
            'username',
            'email',
            'pass'
        ]
    });

    if(userdata.errors) {
        return userdata;
    }

    var passHash = await bcrypt.hash(data.pass, config.security.saltRounds);
    var confirmationCode = await _getCode('confirmationCode');
    
    var newUser = new User({
        email: data.email,
        username: data.username,
        pass: passHash,
        confirmationCode
    });
      
    return await newUser.save((err) => {
        if (err) global.error('New user save error:', err);
    });
}

/**
 * Update specific user with data
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} userId User ID of the to-be-updated user
 * @param  {object} data   Userdata to be updated
 *
 * @return {Promise}       Promise returning the updated user
 */
async function update(userId, data) {
    // definitely check all fields, as they need to be filled
    var userdata = await validate(data);

    if(userdata.errors) {
        return userdata;
    }

    if (data.pass) {
        data.pass = await bcrypt.hash(data.pass, config.security.saltRounds);
    }

    return await User.findByIdAndUpdate(userId, data, { new: true }).exec((err, data) => {
        if (err) global.error('User update error:', err);
    });
}

/**
 * Get a specific user or a userlist
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} username Optional. ID of the user to be returned
 *
 * @return {Promise}         Promise returning the user or an array of users
 */
async function get(username) {
    if (!username) {
        return await User.find(); // show all for debug
        // return await User.where('_roleId').ne(9); // skip root user
    } else {
        return await User.findOne({ username: username });
    }
}

/**
 * PRIVATE - generate a code, and check if its used already
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} fieldname Field, where the code will be used
 *
 * @return {string}           Code which isn't in use yet
 */
async function _getCode(fieldname) {
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

/**
 * PRIVATE - generate a filename, and check if its used already
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} folder Folder to check against
 *
 * @param  {string} ext    Extension to check
 *
 * @return {string}        Filename which isn't in use yet
 */
function _getFileName(folder, ext) {
    var code;
    var err;
    var find = {};

    while(true) {
        code = randomstring.generate({ length: 48, readable: true });

        try {
            fs.accessSync(path.resolve(folder + code + '.' + ext));
        } catch (e) {
            break;
        }
    }

    return code;
}