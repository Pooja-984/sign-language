const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
// Note: We should ideally add auth middleware here, but for now we trust the client logic (protected route)
// or we can import middleware later if needed.

// @route   POST /api/skills
// @desc    Add a new skill
// @access  Public (Protected by frontend or add middleware)
router.post('/', async (req, res) => {
    try {
        const { name, references, userId, thumbnail } = req.body;

        if (!name || !references) {
            return res.status(400).json({ message: 'Name and references are required' });
        }

        // Check if skill exists
        let skill = await Skill.findOne({ name });
        if (skill) {
            return res.status(400).json({ message: 'Skill already exists' });
        }

        skill = new Skill({
            name,
            references,
            thumbnail,
            createdBy: userId
        });

        await skill.save();
        res.status(201).json(skill);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/skills/:id
// @desc    Delete a skill
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        await skill.deleteOne();
        res.json({ message: 'Skill removed' });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Skill not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/skills/:id
// @desc    Update a skill
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const skill = await Skill.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        skill.name = name || skill.name;
        // Logic to update references could go here if needed, but for now just renaming is common

        await skill.save();
        res.json(skill);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/skills
// @desc    Get all skills
// @access  Public
router.get('/', async (req, res) => {
    try {
        const skills = await Skill.find().sort({ createdAt: -1 });
        res.json(skills);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
