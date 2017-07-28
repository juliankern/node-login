const mongoose = require('mongoose');

let schema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true,
        unique: true, 
        trim: true
    },
    createdBy: { 
        required: true, 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
}, global.config.schema);

module.exports = mongoose.model('Group', schema);