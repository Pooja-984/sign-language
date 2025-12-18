const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Route
router.post('/register', async (req, res) => {
    const { username, email, password, adminSecret } = req.body;

    try {
        console.log('Register request received:', req.body);
        // Check if user already exists
        let user = await User.findOne({ email });
        console.log('User check result:', user);
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check username uniqueness if desired
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        user = new User({
            username,
            email,
            password,
            role: adminSecret === 'secret123' ? 'admin' : 'user'
        });

        await user.save();

        // Create JWT Payload
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };

        // Sign Token
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallbackSecretKeyChangeInProduction',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Check Password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Create JWT Payload
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };

        // Sign Token
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallbackSecretKeyChangeInProduction',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
