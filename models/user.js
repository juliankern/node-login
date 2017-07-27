var mongoose = require('mongoose');
var gravatar = require('gravatar');

var validator = global.req('utils/validation');

var schema = new mongoose.Schema({ 
    username: {
        type: String,
        required: true,
        unique: true
    },
    firstName: { type: String },
    lastName: { type: String },
    pass: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        match: validator.regex.email
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    confirmationCode: { type: String },
    imageFilename: { type: String },
    imageExt: { type: String },
    passwordRequestCode: { type: String },
    _roleId: { 
        type: Number,
        default: 1
    }
}, global.config.schema);

schema.virtual('role').get(function () {
    return global.config.roles[this._roleId];
});

schema.virtual('fullName').get(function () {
    return this.firstName + ' ' + this.lastName;
});

schema.virtual('image').get(function() {
    return (this.imageFilename && this.imageFilename !== '') ? '/uploads/' + this.imageFilename + '.' + this.imageExt : gravatar.url(this.email, { d: 'mm', s: 400 });
});

schema.virtual('thumbnail').get(function() {
    return (this.imageFilename && this.imageFilename !== '') ? '/uploads/' + this.imageFilename + '_thumb.' + this.imageExt : gravatar.url(this.email, { d: 'mm', s: 100 });
});

schema.methods.hasRight = function (right) {
    return this.role.rights.includes(right);
}

schema.methods.isEqual = function (user) {
    return this.id === user.id;
}

module.exports = mongoose.model('User', schema);