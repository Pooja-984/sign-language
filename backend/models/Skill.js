const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    references: {
        type: Array, // Array of reference objects { name: "Label", reference: [...] }
        required: true
    },
    thumbnail: {
        type: String, // Base64 or URL
        default: ""
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Skill', SkillSchema);
