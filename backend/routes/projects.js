const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize, Project, ProjectMember, Task, User, Activity } = require('../models');
const auth = require('../middleware/auth');

// Helper: check if user is project admin
const isProjectAdmin = (members, ownerId, userId) => {
  if (ownerId === userId) return true;
  return members.some(m => m.userId === userId && m.role === 'admin');
};

// Helper: check if user is project member
const isProjectMember = (members, userId) => {
  return members.some(m => m.userId === userId);
};

// Standard includes for project queries
const projectIncludes = [
  { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
  {
    model: ProjectMember, as: 'members',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }]
  }
];

// GET /api/projects - Get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    // Find all project IDs where user is a member
    const memberships = await ProjectMember.findAll({
      where: { userId: req.userId },
      attributes: ['projectId']
    });
    const projectIds = memberships.map(m => m.projectId);

    const projects = await Project.findAll({
      where: { id: { [Op.in]: projectIds } },
      include: projectIncludes,
      order: [['updatedAt', 'DESC']]
    });

    // Add task counts for each project
    const projectsWithCounts = await Promise.all(projects.map(async (project) => {
      const taskCounts = await Task.findAll({
        where: { projectId: project.id },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true
      });

      const counts = { todo: 0, in_progress: 0, in_review: 0, done: 0, total: 0 };
      taskCounts.forEach(tc => {
        counts[tc.status] = parseInt(tc.count);
        counts.total += parseInt(tc.count);
      });

      const overdueCount = await Task.count({
        where: {
          projectId: project.id,
          status: { [Op.ne]: 'done' },
          dueDate: { [Op.lt]: new Date() }
        }
      });

      return { ...project.toJSON(), taskCounts: counts, overdueCount };
    }));

    res.json({ projects: projectsWithCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects - Create project
router.post('/', auth, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description, color, dueDate } = req.body;

    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      dueDate: dueDate || null,
      ownerId: req.userId
    });

    // Add owner as admin member
    await ProjectMember.create({
      projectId: project.id,
      userId: req.userId,
      role: 'admin'
    });

    // Log activity
    await Activity.create({
      action: 'project_created',
      userId: req.userId,
      projectId: project.id,
      details: { projectName: name }
    });

    // Fetch with includes
    const fullProject = await Project.findByPk(project.id, { include: projectIncludes });
    res.status(201).json({ project: fullProject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, { include: projectIncludes });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { projectId: project.id }, raw: true });
    if (!isProjectMember(members, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['active', 'archived', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { projectId: project.id }, raw: true });
    if (!isProjectAdmin(members, project.ownerId, req.userId)) {
      return res.status(403).json({ message: 'Only admins can update projects' });
    }

    const { name, description, color, status, dueDate } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (status !== undefined) updates.status = status;
    if (dueDate !== undefined) updates.dueDate = dueDate || null;

    await project.update(updates);

    const fullProject = await Project.findByPk(project.id, { include: projectIncludes });
    res.json({ project: fullProject });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only project owner can delete it' });
    }

    // Delete related data
    await Task.destroy({ where: { projectId: project.id } });
    await ProjectMember.destroy({ where: { projectId: project.id } });
    await Activity.destroy({ where: { projectId: project.id } });
    await project.destroy();

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members - Add member
router.post('/:id/members', auth, [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('role').optional().isIn(['admin', 'member'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { projectId: project.id }, raw: true });
    if (!isProjectAdmin(members, project.ownerId, req.userId)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const { email, role = 'member' } = req.body;
    const userToAdd = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!userToAdd) return res.status(404).json({ message: 'User not found with that email' });

    const alreadyMember = members.some(m => m.userId === userToAdd.id);
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    await ProjectMember.create({
      projectId: project.id,
      userId: userToAdd.id,
      role
    });

    // Log activity
    await Activity.create({
      action: 'member_added',
      userId: req.userId,
      projectId: project.id,
      details: { memberName: userToAdd.name, memberEmail: userToAdd.email, role }
    });

    const fullProject = await Project.findByPk(project.id, { include: projectIncludes });
    res.json({ project: fullProject, message: `${userToAdd.name} added to project` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id/members/:memberId - Update member role
router.put('/:id/members/:memberId', auth, [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { projectId: project.id }, raw: true });
    if (!isProjectAdmin(members, project.ownerId, req.userId)) {
      return res.status(403).json({ message: 'Only admins can change roles' });
    }
    if (project.ownerId === parseInt(req.params.memberId)) {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }

    const member = await ProjectMember.findOne({
      where: { projectId: project.id, userId: req.params.memberId }
    });
    if (!member) return res.status(404).json({ message: 'Member not found' });

    await member.update({ role: req.body.role });

    // Log activity
    await Activity.create({
      action: 'role_changed',
      userId: req.userId,
      projectId: project.id,
      details: { memberId: parseInt(req.params.memberId), newRole: req.body.role }
    });

    const fullProject = await Project.findByPk(project.id, { include: projectIncludes });
    res.json({ project: fullProject });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:memberId - Remove member
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { projectId: project.id }, raw: true });
    const adminCheck = isProjectAdmin(members, project.ownerId, req.userId);
    const isSelf = req.userId === parseInt(req.params.memberId);

    if (!adminCheck && !isSelf) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    if (project.ownerId === parseInt(req.params.memberId)) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    await ProjectMember.destroy({
      where: { projectId: project.id, userId: req.params.memberId }
    });

    // Log activity
    await Activity.create({
      action: 'member_removed',
      userId: req.userId,
      projectId: project.id,
      details: { memberId: parseInt(req.params.memberId) }
    });

    const fullProject = await Project.findByPk(project.id, { include: projectIncludes });
    res.json({ project: fullProject, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id/stats - Project statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { projectId: project.id }, raw: true });
    if (!isProjectMember(members, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [statusCounts, priorityCounts, overdueTasks] = await Promise.all([
      Task.findAll({
        where: { projectId: project.id },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true
      }),
      Task.findAll({
        where: { projectId: project.id },
        attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['priority'],
        raw: true
      }),
      Task.findAll({
        where: {
          projectId: project.id,
          status: { [Op.ne]: 'done' },
          dueDate: { [Op.lt]: new Date() }
        },
        include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }],
        order: [['dueDate', 'ASC']],
        limit: 5
      })
    ]);

    const stats = { byStatus: {}, byPriority: {}, overdueTasks, total: 0 };
    statusCounts.forEach(s => { stats.byStatus[s.status] = parseInt(s.count); stats.total += parseInt(s.count); });
    priorityCounts.forEach(p => { stats.byPriority[p.priority] = parseInt(p.count); });

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
