var validator = require('../utils/validation.js');
var mongoose = require('mongoose');

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
        match: validator.emailRegex
    }
});

module.exports = mongoose.model('User', schema);