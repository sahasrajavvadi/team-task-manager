const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User } = require('../models');
const auth = require('../middleware/auth');

// GET /api/users - Get all users (for admin to add members to projects)
router.get('/', auth, async (req, res) => {
  try {
    // Only admins can list all users
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'avatar', 'isAdmin'],
      order: [['name', 'ASC']]
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/search?email=...&name=...
router.get('/search', auth, async (req, res) => {
  try {
    const { email, name } = req.query;

    if (!email && !name) {
      return res.status(400).json({ message: 'Provide email or name to search' });
    }

    const where = { id: { [Op.ne]: req.userId } };
    if (email) where.email = { [Op.like]: `%${email}%` };
    if (name) where.name = { [Op.like]: `%${name}%` };

    const users = await User.findAll({
      where,
      limit: 10,
      attributes: ['id', 'name', 'email', 'avatar']
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
