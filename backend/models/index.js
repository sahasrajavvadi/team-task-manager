const { Sequelize, DataTypes } = require('sequelize');

// Build connection URL
const DB_URL = process.env.MYSQL_URL || process.env.DATABASE_URL ||
  `mysql://${process.env.MYSQLUSER || 'root'}:${process.env.MYSQLPASSWORD || ''}@${process.env.MYSQLHOST || 'localhost'}:${process.env.MYSQLPORT || 3306}/${process.env.MYSQLDATABASE || 'taskflow'}`;

const sequelize = new Sequelize(DB_URL, {
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: { timestamps: true, underscored: false }
});

// ──────────────────── USER ────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: { args: [2, 100], msg: 'Name must be 2-100 characters' } }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: { msg: 'Email already registered' },
    validate: { isEmail: { msg: 'Please enter a valid email' } },
    set(val) { this.setDataValue('email', val.toLowerCase().trim()); }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { len: { args: [6, 255], msg: 'Password must be at least 6 characters' } }
  },
  avatar: { type: DataTypes.STRING(500), defaultValue: '' },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'users',
  defaultScope: { attributes: { exclude: ['password'] } },
  scopes: { withPassword: { attributes: {} } }
});

// ──────────────────── PROJECT ────────────────────
const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: { args: [2, 100], msg: 'Project name must be 2-100 characters' } }
  },
  description: {
    type: DataTypes.TEXT,
    validate: { len: { args: [0, 500], msg: 'Description cannot exceed 500 characters' } }
  },
  color: { type: DataTypes.STRING(10), defaultValue: '#6366f1' },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'completed'),
    defaultValue: 'active'
  },
  dueDate: { type: DataTypes.DATEONLY }
}, { tableName: 'projects' });

// ──────────────────── PROJECT MEMBER (join table) ────────────────────
const ProjectMember = sequelize.define('ProjectMember', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
    validate: { isIn: { args: [['admin', 'member']], msg: 'Role must be admin or member' } }
  },
  joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'project_members',
  indexes: [{ unique: true, fields: ['projectId', 'userId'] }]
});

// ──────────────────── TASK ────────────────────
const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { len: { args: [2, 200], msg: 'Title must be 2-200 characters' } }
  },
  description: {
    type: DataTypes.TEXT,
    validate: { len: { args: [0, 2000], msg: 'Description cannot exceed 2000 characters' } }
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'in_review', 'done'),
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  dueDate: { type: DataTypes.DATEONLY },
  completedAt: { type: DataTypes.DATE },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'tasks',
  indexes: [
    { fields: ['projectId', 'status'] },
    { fields: ['assigneeId'] },
    { fields: ['dueDate'] }
  ],
  hooks: {
    beforeSave: (task) => {
      if (task.changed('status')) {
        if (task.status === 'done' && !task.completedAt) {
          task.completedAt = new Date();
        } else if (task.status !== 'done') {
          task.completedAt = null;
        }
      }
    }
  }
});

// ──────────────────── COMMENT ────────────────────
const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: { args: [1, 1000], msg: 'Comment must be 1-1000 characters' },
      notEmpty: { msg: 'Comment cannot be empty' }
    }
  }
}, { tableName: 'comments', updatedAt: false });

// ──────────────────── ACTIVITY LOG ────────────────────
const Activity = sequelize.define('Activity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
    // Values: task_created, task_updated, task_deleted, task_commented,
    //         project_created, member_added, member_removed, role_changed
  },
  details: { type: DataTypes.JSON, defaultValue: {} }
}, { tableName: 'activities', updatedAt: false });

// ──────────────────── ASSOCIATIONS ────────────────────

// User <-> Project (owner)
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Project <-> ProjectMember <-> User
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'members', onDelete: 'CASCADE', hooks: true });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ProjectMember, { foreignKey: 'userId' });

// Task associations
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE', hooks: true });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });

// Comment associations
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments', onDelete: 'CASCADE', hooks: true });
Comment.belongsTo(Task, { foreignKey: 'taskId' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Activity associations
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Activity.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Activity.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Project.hasMany(Activity, { foreignKey: 'projectId', as: 'activities', onDelete: 'CASCADE', hooks: true });

module.exports = { sequelize, User, Project, ProjectMember, Task, Comment, Activity };
