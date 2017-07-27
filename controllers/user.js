const jimp = require('jimp');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const randomstring = require('randomstring');

const validator = global.req('utils/validation');
const security = global.req('controllers/security');

const User = global.req('models/user.js');

module.exports = {
    find,
    passwordRequest,
    confirm,
    create,
    update,
    get,
    image,
    changeSettings
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

async function changeSettings(user, req) {
    let victim = await find([{ _id: user }, { username: user }]);

    if (req.body.removeimage) {
        if (!(await update(victim.id, { imageFilename: undefined, imageExt: undefined }, req.user))) {
            global.error('Image could not be removed');
            req.flash('error', { messageTranslate: 'route.settings.imageerror:Fehler beim Bildupload!' });
        }

        return true;
    }

    if (req.body.pass === '') {
        delete req.body.pass;
        delete req.body.pass2;
    }

    if (req.body.confirmed === '') {
        delete req.body.confirmed;
    }

    if (victim.email === req.body.email) {
        delete req.body.email;
    }

    if (victim.username === req.body.username) {
        delete req.body.username;
    }

    if (victim._roleId !== +req.body.role && (
            (req.user.isEqual(victim) && req.user.hasRight('user.edit.own.role')) || 
            (!req.user.isEqual(victim) && req.user.hasRight('user.edit.all.role'))
        )
    ) {
        req.body._roleId = req.body.role;
    }
    delete req.body.role;

    let updatedUser = await update(victim.id, req.body, req.user);
    
    if(updatedUser.errors && updatedUser.errors.length > 0) {
        req.arrayFlash(updatedUser.errors, 'error');
    } else {
        let upload;

        if (req.files && Object.keys(req.files).length > 0) {
            upload = await image(victim.id, req.files.image);
        } 
            
        if ((req.files && Object.keys(req.files).length > 0 && upload) || Object.keys(req.files).length === 0) {
            req.flash('success', { messageTranslate: 'route.settings.success:Daten erfolgreich gespeichert!' });
        } else {
            req.flash('error', { messageTranslate: 'route.settings.imageerror:Fehler beim Bildupload!' });
        }
    }

    return updatedUser;
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
    let passwordRequestCode = await _getCode('passwordRequestCode');
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
    let user = await User.findOne({ confirmationCode: code, confirmed: false });
    
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
 * Creates new user
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} data Userdata for the new user
 *
 * @return {Promise}     Promise returning the created user
 */
async function create(data, options) {
    options = options || { new: false };
    // definitely check all fields, as they need to be filled
    let userdata = await _validate(data, {
        check: [
            'username',
            'email',
            'pass'
        ],
        new: options.new
    });

    if(userdata.errors) {
        return userdata;
    }

    let passHash = await bcrypt.hash(data.pass, global.config.security.saltRounds);
    let confirmationCode = await _getCode('confirmationCode');
    
    let newUser = new User({
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
async function update(userId, data, user) {
    let userdata = await _validate(Object.assign({}, data, { id: userId }), null, user);

    if(userdata.errors) {
        return userdata;
    }

    if (data.pass) {
        data.pass = await bcrypt.hash(data.pass, global.config.security.saltRounds);
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
        return await find({ username: username });
    }
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
        let ext = image.name.split('.').pop();
        let file = _getFileName(global.approot + global.config.app.uploads, ext);
        let filepath = path.resolve(global.approot + global.config.app.uploads + file);

        image.mv(filepath + '.' + ext, async (err) => {
            if (err) return reject(err);
            
            (await jimp.read(image.data))
                .cover(100, 100)
                .quality(60)
                .write(filepath + '_thumb.' + ext);

            if((await update(userId, { imageFilename: file, imageExt: ext })).image) {
                resolve(true);
            } else {
                // delete images here if update failed
                (await update(userId, { imageFilename: undefined, imageExt: undefined }));
                fs.unlinkSync(filepath + '.' + ext);
                fs.unlinkSync(filepath + '_thumb.' + ext);
                reject();
            }
        })
    }).catch((err) => {
        global.error('Image save failed!', err);
    });
}

/**
 * PRIVATE - Validate userdata
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} data    Form data
 * @param  {object} options Options for the check. Currently possible:
 *                          - check: {Array}    containing the field names which should definitely be checked, even if not set
 * @param  {object} user    Current active user
 *
 * @return {object}         Object containung the original data and errors if occured
 */
async function _validate(data, options, user) {
    let errors = [];
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

    if ((data._roleId || data.role) && (
        options.new || (
            user && (
                (user.isEqual(data) && !user.hasRight('user.edit.own.role')) ||
                (!user.isEqual(data) && !user.hasRight('user.edit.all.role'))
            )
        )
    )) {
        errors.push({ fields: ['role'], messageTranslate: 'user.validate.role:Sie können Ihre Rolle nicht ändern!' });
    }

    return await Object.assign({}, data, { errors: errors.length > 0 ? errors : null });
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
    let code;
    let find = {};
    
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
    let code;
    let err;
    let find = {};

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