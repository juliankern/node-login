var validator = require('../utils/validation.js');
var mongoose = require('mongoose');
var config = require('../config.json');

var schema = new mongoose.Schema({ 
    username: {
        type: String,
        required: true,
        unique: true
    },
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
    _roleId: { 
        type: Number,
        default: 1
    }
}, config.schema);

schema.virtual('role').get(function () {
    return config.roles[this._roleId];
});

schema.methods.hasRight = function (right) {
    return this.role.rights.includes(right);
}

schema.methods.isEqual = function (user) {
    return this.id === user.id;
}

module.exports = mongoose.model('User', schema);