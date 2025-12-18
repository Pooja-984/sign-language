const express = require('express');
const router = express.Router();

// Test Route
router.get('/status', (req, res) => {
    res.json({ status: 'API is running' });
});

router.get('/videos/all-videos', (req, res) => {
    // Mock response for now as video logic is not migrated
    res.json([]);
});

module.exports = router;
