const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize, Task, Project, ProjectMember, User, Comment, Activity } = require('../models');
const auth = require('../middleware/auth');

const isProjectMember = (members, userId) => {
  return members.some(m => m.userId === userId);
};

const isProjectAdmin = (members, ownerId, userId) => {
  if (ownerId === userId) return true;
  return members.some(m => m.userId === userId && m.role === 'admin');
};

// Standard includes for task queries
const taskIncludes = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatar'] },
  { model: User, as: 'createdBy', attributes: ['id', 'name', 'email', 'avatar'] },
  { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
];

const taskWithComments = [
  ...taskIncludes,
  {
    model: Comment, as: 'comments',
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] }],
    order: [['createdAt', 'ASC']]
  }
];

// GET /api/tasks - Get tasks (filtered)
router.get('/', auth, async (req, res) => {
  try {
    const { project, status, priority, assignee, overdue, search } = req.query;

    // Get user's project IDs
    const memberships = await ProjectMember.findAll({
      where: { userId: req.userId },
      attributes: ['projectId'],
      raw: true
    });
    const projectIds = memberships.map(m => m.projectId);

    const where = { projectId: { [Op.in]: projectIds } };
    if (project) where.projectId = parseInt(project);
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignee === 'me') where.assigneeId = req.userId;
    else if (assignee) where.assigneeId = parseInt(assignee);
    if (overdue === 'true') {
      where.status = { [Op.ne]: 'done' };
      where.dueDate = { [Op.lt]: new Date() };
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const tasks = await Task.findAll({
      where,
      include: taskIncludes,
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/dashboard - Dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const memberships = await ProjectMember.findAll({
      where: { userId: req.userId },
      attributes: ['projectId'],
      raw: true
    });
    const projectIds = memberships.map(m => m.projectId);

    if (projectIds.length === 0) {
      return res.json({
        stats: { myTasks: 0, byStatus: { todo: 0, in_progress: 0, in_review: 0, done: 0 }, totalProjects: 0, overdueTasks: 0 },
        overdueTasks: [],
        recentTasks: []
      });
    }

    const [myTasks, statusCounts, overdueTasks, recentTasks] = await Promise.all([
      Task.count({
        where: { assigneeId: req.userId, status: { [Op.ne]: 'done' } }
      }),
      Task.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true
      }),
      Task.findAll({
        where: {
          projectId: { [Op.in]: projectIds },
          status: { [Op.ne]: 'done' },
          dueDate: { [Op.lt]: new Date() }
        },
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
        ],
        order: [['dueDate', 'ASC']],
        limit: 5
      }),
      Task.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
          { model: User, as: 'createdBy', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    ]);

    const byStatus = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    statusCounts.forEach(s => { byStatus[s.status] = parseInt(s.count); });

    res.json({
      stats: {
        myTasks,
        byStatus,
        totalProjects: projectIds.length,
        overdueTasks: overdueTasks.length
      },
      overdueTasks,
      recentTasks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/my-tasks - Get all tasks assigned to current user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assigneeId: req.userId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ],
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ tasks, stats: { total: tasks.length } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks - Create task
router.post('/', auth, [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('project').isInt().withMessage('Valid project ID required'),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, project, status, priority, assignee, dueDate, tags } = req.body;

    const projectDoc = await Project.findByPk(project);
    if (!projectDoc) return res.status(404).json({ message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { projectId: project }, raw: true });
    if (!isProjectMember(members, req.userId)) {
      return res.status(403).json({ message: 'Not a project member' });
    }

    // Validate assignee — if admin, auto-add as project member; otherwise must already be a member
    if (assignee) {
      const assigneeIsMember = members.some(m => m.userId === parseInt(assignee));
      if (!assigneeIsMember) {
        // Check if the current user is admin
        const currentUser = await User.findByPk(req.userId);
        if (currentUser && currentUser.isAdmin) {
          // Verify the assignee user exists
          const assigneeUser = await User.findByPk(parseInt(assignee));
          if (!assigneeUser) {
            return res.status(404).json({ message: 'Assignee user not found' });
          }
          // Auto-add assignee as a project member
          await ProjectMember.create({
            projectId: project,
            userId: parseInt(assignee),
            role: 'member'
          });
        } else {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId: project,
      status: status || 'todo',
      priority: priority || 'medium',
      assigneeId: assignee || null,
      dueDate: dueDate || null,
      tags: tags || [],
      createdById: req.userId
    });

    // Log activity
    await Activity.create({
      action: 'task_created',
      userId: req.userId,
      projectId: project,
      taskId: task.id,
      details: { taskTitle: title }
    });

    const fullTask = await Task.findByPk(task.id, { include: taskIncludes });
    res.status(201).json({ task: fullTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, { include: taskWithComments });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const members = await ProjectMember.findAll({ where: { projectId: task.projectId }, raw: true });
    if (!isProjectMember(members, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const members = await ProjectMember.findAll({ where: { projectId: task.projectId }, raw: true });
    if (!isProjectMember(members, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {};
    const fields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags', 'order'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (req.body.assignee !== undefined) {
      const newAssigneeId = req.body.assignee ? parseInt(req.body.assignee) : null;
      if (newAssigneeId) {
        const assigneeIsMember = members.some(m => m.userId === newAssigneeId);
        if (!assigneeIsMember) {
          const currentUser = await User.findByPk(req.userId);
          if (currentUser && currentUser.isAdmin) {
            const assigneeUser = await User.findByPk(newAssigneeId);
            if (assigneeUser) {
              await ProjectMember.create({
                projectId: task.projectId,
                userId: newAssigneeId,
                role: 'member'
              });
            }
          }
        }
      }
      updates.assigneeId = newAssigneeId;
    }
    if (updates.dueDate === '') updates.dueDate = null;

    // Track status change for activity
    const oldStatus = task.status;
    await task.update(updates);

    // Log activity
    if (updates.status && updates.status !== oldStatus) {
      await Activity.create({
        action: 'task_updated',
        userId: req.userId,
        projectId: task.projectId,
        taskId: task.id,
        details: { taskTitle: task.title, field: 'status', from: oldStatus, to: updates.status }
      });
    }

    const fullTask = await Task.findByPk(task.id, { include: taskIncludes });
    res.json({ task: fullTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findByPk(task.projectId);
    const members = await ProjectMember.findAll({ where: { projectId: task.projectId }, raw: true });
    const canDelete = isProjectAdmin(members, project.ownerId, req.userId) ||
      task.createdById === req.userId;

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    // Log activity before deletion
    await Activity.create({
      action: 'task_deleted',
      userId: req.userId,
      projectId: task.projectId,
      details: { taskTitle: task.title }
    });

    await Comment.destroy({ where: { taskId: task.id } });
    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', auth, [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const members = await ProjectMember.findAll({ where: { projectId: task.projectId }, raw: true });
    if (!isProjectMember(members, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Comment.create({
      text: req.body.text,
      taskId: task.id,
      authorId: req.userId
    });

    // Log activity
    await Activity.create({
      action: 'task_commented',
      userId: req.userId,
      projectId: task.projectId,
      taskId: task.id,
      details: { taskTitle: task.title }
    });

    // Return all comments for this task
    const comments = await Comment.findAll({
      where: { taskId: task.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] }],
      order: [['createdAt', 'ASC']]
    });

    res.status(201).json({ comments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
