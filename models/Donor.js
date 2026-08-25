const mongoose = require('mongoose');
const validator = require('validator');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (value) => {
                return validator.isEmail(value) && value.endsWith('@gmail.com');
            },
            message: 'Please enter a valid Gmail address'
        }
    },
    phoneNumber: {
        type: String,
        validate: {
            validator: function(value) {
                // If no phone number but has Facebook URL, it's valid
                if (!value && this.facebookProfileUrl) return true;
                // If phone number provided, must be 11 digits
                return /^\d{11}$/.test(value);
            },
            message: props => `${props.value} is not a valid phone number! Must be exactly 11 digits.`
        }
    },
    lastDonatedDate: {
        type: Date,
        validate: {
            validator: function(value) {
                // If no date provided, it's valid
                if (!value) return true;
                // If date provided, must not be in future
                const currentDate = new Date();
                return value <= currentDate;
            },
            message: 'Last donated date cannot be in the future'
        }
    },
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: BLOOD_GROUPS
    },
    facebookProfileUrl: {
        type: String,
        validate: {
            validator: function(value) {
                // If no Facebook URL but has phone number, it's valid
                if (!value && this.phoneNumber) return true;
                // If Facebook URL provided, must be valid format
                return /^https?:\/\/(www\.)?(facebook|fb)\.com\/[\w.-]+[^/]$/.test(value);
            },
            message: 'Please enter a valid Facebook profile URL'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

donorSchema.index({ bloodGroup: 1, createdAt: -1 });

const Donor = mongoose.model('Donor', donorSchema);

module.exports = { Donor, BLOOD_GROUPS };
