const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Activity, User, Project, Task, ProjectMember } = require('../models');
const auth = require('../middleware/auth');

// GET /api/activity - Get activity feed for user's projects
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, limit = 30, offset = 0 } = req.query;

    // Get user's project IDs
    const memberships = await ProjectMember.findAll({
      where: { userId: req.userId },
      attributes: ['projectId'],
      raw: true
    });
    const projectIds = memberships.map(m => m.projectId);

    if (projectIds.length === 0) {
      return res.json({ activities: [], total: 0 });
    }

    const where = { projectId: { [Op.in]: projectIds } };
    if (projectId) where.projectId = parseInt(projectId);

    const { count, rows: activities } = await Activity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
        { model: Task, as: 'task', attributes: ['id', 'title'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ activities, total: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
