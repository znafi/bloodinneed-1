const express = require('express');
const router = express.Router();
const { Donor, BLOOD_GROUPS } = require('../models/Donor');

const MAX_RESULTS = 500;

// Only these fields may be set by a client; anything else in the body is ignored.
const WRITABLE_FIELDS = [
    'name',
    'location',
    'email',
    'phoneNumber',
    'bloodGroup',
    'lastDonatedDate',
    'facebookProfileUrl'
];

router.get('/', async (req, res, next) => {
    try {
        const { bloodGroup } = req.query;
        const query = {};

        // Compare against the known set rather than passing the raw value
        // through: Express parses `?bloodGroup[$ne]=x` into an object, which
        // would otherwise reach MongoDB as an operator.
        if (bloodGroup !== undefined && bloodGroup !== 'All') {
            if (typeof bloodGroup !== 'string' || !BLOOD_GROUPS.includes(bloodGroup)) {
                return res.status(400).json({ error: 'Invalid blood group' });
            }
            query.bloodGroup = bloodGroup;
        }

        const donors = await Donor.find(query)
            .sort({ createdAt: -1 })
            .limit(MAX_RESULTS)
            .select('-__v')
            .lean();

        res.json(donors);
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const payload = {};
        for (const field of WRITABLE_FIELDS) {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                payload[field] = req.body[field];
            }
        }

        const requiredFields = ['name', 'location', 'email', 'bloodGroup'];
        const missingFields = requiredFields.filter((field) => !payload[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        if (!payload.phoneNumber && !payload.facebookProfileUrl) {
            return res.status(400).json({
                error: 'Either Phone Number or Facebook Profile URL is required'
            });
        }

        const donor = await Donor.create(payload);

        res.status(201).json(donor);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'A donor with this email already exists.'
            });
        }

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors)
                .map((detail) => detail.message)
                .join(' ');
            return res.status(400).json({ error: message });
        }

        next(error);
    }
});

module.exports = router;
