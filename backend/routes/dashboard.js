const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Skill = require('../models/Skill');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (users, models, recent activity)
// @access  Public (Protected by frontend or add middleware)
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalModels = await Skill.countDocuments();

        // Get 5 most recent skills
        const recentActivity = await Skill.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name createdAt');

        // Get 5 recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username email role createdAt');

        res.json({
            totalUsers,
            totalModels,
            recentActivity,
            recentUsers
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
