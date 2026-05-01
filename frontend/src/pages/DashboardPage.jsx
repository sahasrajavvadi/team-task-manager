import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ListTodo, Loader, TrendingUp, Plus, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const StatusBadge = ({ status }) => {
  const labels = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
};

const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority}</span>
);

// ════════════════════════════════════
// USER DASHBOARD - Regular users only see their assigned tasks
// ════════════════════════════════════
function UserDashboard({ user }) {
  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks/my-tasks').then(r => r.data)
  });

  if (isLoading) return (
    <div className="page-loading">
      <div className="loader"></div>
    </div>
  );

  const { tasks = [], stats = {} } = data || {};

  const statCards = [
    { label: 'Total Tasks', value: tasks.length || 0, icon: ListTodo, color: 'var(--accent-light)', bg: 'var(--accent-subtle)' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length || 0, icon: Loader, color: 'var(--blue)', bg: 'var(--blue-glow)' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'done').length || 0, icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-glow)' },
    { label: 'To Do', value: tasks.filter(t => t.status === 'todo').length || 0, icon: AlertTriangle, color: 'var(--red)', bg: 'var(--red-glow)' },
  ];

  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });

  const completedTasks = tasks.filter(t => t.status === 'done');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here are your assigned tasks.</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={card.label} className="stat-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-icon-wrapper" style={{ background: card.bg, color: card.color }}>
              <card.icon size={18} />
            </div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Completion rate bar */}
      {tasks.length > 0 && (
        <div className="completion-card card animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="completion-header">
            <div className="completion-info">
              <TrendingUp size={16} style={{ color: 'var(--green)' }} />
              <span className="completion-label">Your Progress</span>
            </div>
            <span className="completion-pct">{completionRate}%</span>
          </div>
          <div className="completion-bar">
            <div className="completion-fill" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Today's Tasks */}
        <div className="card animate-in" style={{ animationDelay: '0.25s' }}>
          <div className="section-header">
            <Clock size={16} style={{ color: 'var(--blue)' }} />
            <h2 className="section-title">Today's Tasks</h2>
          </div>
          {todayTasks.length === 0 ? (
            <div className="empty-inline">
              <CheckCircle2 size={24} style={{ color: 'var(--green)', margin: '0 auto 8px' }} />
              <p>No tasks due today 🎉</p>
            </div>
          ) : (
            <div className="task-list">
              {todayTasks.map(task => (
                <div key={task.id} className="task-row">
                  <div className="task-row-left">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="meta-project" style={{ background: task.project?.color + '18', color: task.project?.color }}>
                        {task.project?.name}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                  <div className="task-row-right">
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Tasks */}
        <div className="card animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="section-header">
            <ListTodo size={16} style={{ color: 'var(--text-muted)' }} />
            <h2 className="section-title">All Assigned Tasks</h2>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-inline">
              <FolderKanban size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <p>No tasks assigned yet. Check back soon!</p>
            </div>
          ) : (
            <div className="task-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {tasks.map(task => (
                <div key={task.id} className="task-row">
                  <div className="task-row-left">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="meta-project" style={{ background: task.project?.color + '18', color: task.project?.color }}>
                        {task.project?.name}
                      </span>
                      {task.dueDate && (
                        <span className="meta-date">
                          <Clock size={10} /> {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-row-right">
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════
// ADMIN DASHBOARD - Admins see all projects, tasks, and can create
// ════════════════════════════════════
function AdminDashboard({ user }) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/tasks/dashboard').then(r => r.data)
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity-recent'],
    queryFn: () => api.get('/activity', { params: { limit: 8 } }).then(r => r.data)
  });

  if (isLoading) return (
    <div className="page-loading">
      <div className="loader"></div>
    </div>
  );

  const { stats, overdueTasks = [], recentTasks = [] } = data || {};
  const activities = activityData?.activities || [];

  const statCards = [
    { label: 'Open Tasks', value: stats?.myTasks || 0, icon: ListTodo, color: 'var(--accent-light)', bg: 'var(--accent-subtle)' },
    { label: 'In Progress', value: stats?.byStatus?.in_progress || 0, icon: Loader, color: 'var(--blue)', bg: 'var(--blue-glow)' },
    { label: 'Completed', value: stats?.byStatus?.done || 0, icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-glow)' },
    { label: 'Overdue', value: stats?.overdueTasks || 0, icon: AlertTriangle, color: 'var(--red)', bg: 'var(--red-glow)' },
  ];

  const totalTasks = Object.values(stats?.byStatus || {}).reduce((a, b) => a + b, 0);
  const completionRate = totalTasks > 0 ? Math.round(((stats?.byStatus?.done || 0) / totalTasks) * 100) : 0;

  const actionLabels = {
    task_created: 'created a task',
    task_updated: 'updated a task',
    task_deleted: 'deleted a task',
    task_commented: 'commented on',
    project_created: 'created a project',
    member_added: 'added a member',
    member_removed: 'removed a member',
    role_changed: 'changed a role',
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here's your full overview.</p>
        </div>
        <div className="header-actions">
          <Link to="/projects" className="btn btn-primary">
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={card.label} className="stat-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-icon-wrapper" style={{ background: card.bg, color: card.color }}>
              <card.icon size={18} />
            </div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Completion rate bar */}
      {totalTasks > 0 && (
        <div className="completion-card card animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="completion-header">
            <div className="completion-info">
              <TrendingUp size={16} style={{ color: 'var(--green)' }} />
              <span className="completion-label">Overall Completion</span>
            </div>
            <span className="completion-pct">{completionRate}%</span>
          </div>
          <div className="completion-bar">
            <div className="completion-fill" style={{ width: `${completionRate}%` }}></div>
          </div>
          <div className="completion-breakdown">
            {['todo', 'in_progress', 'in_review', 'done'].map(status => (
              <div key={status} className="breakdown-item">
                <div className={`breakdown-dot badge-${status}`}></div>
                <span className="breakdown-label">{status === 'in_progress' ? 'In Progress' : status === 'in_review' ? 'In Review' : status === 'todo' ? 'To Do' : 'Done'}</span>
                <span className="breakdown-count">{stats?.byStatus?.[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Overdue tasks */}
        <div className="card animate-in" style={{ animationDelay: '0.25s' }}>
          <div className="section-header">
            <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
            <h2 className="section-title">Overdue Tasks</h2>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="empty-inline">
              <CheckCircle2 size={24} style={{ color: 'var(--green)', margin: '0 auto 8px' }} />
              <p>No overdue tasks 🎉</p>
            </div>
          ) : (
            <div className="task-list">
              {overdueTasks.map(task => (
                <div key={task.id} className="task-row">
                  <div className="task-row-left">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="meta-project" style={{ background: task.project?.color + '18', color: task.project?.color }}>
                        {task.project?.name}
                      </span>
                      {task.dueDate && (
                        <span className="meta-date overdue-date">
                          <Clock size={10} /> Due {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-row-right">
                    {task.assignee && (
                      <div className="avatar avatar-sm" title={task.assignee.name}
                        style={{ background: `hsl(${task.assignee.name?.charCodeAt(0) * 5}, 50%, 40%)` }}>
                        {task.assignee.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="card animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="section-header">
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <h2 className="section-title">Recent Tasks</h2>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-inline">
              <FolderKanban size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <p>No tasks yet. <Link to="/projects">Create a project</Link> to start.</p>
            </div>
          ) : (
            <div className="task-list">
              {recentTasks.map(task => (
                <div key={task.id} className="task-row">
                  <div className="task-row-left">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="meta-project" style={{ background: task.project?.color + '18', color: task.project?.color }}>
                        {task.project?.name}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                  <div className="task-row-right">
                    {task.assignee && (
                      <div className="avatar avatar-sm" title={task.assignee.name}
                        style={{ background: `hsl(${task.assignee.name?.charCodeAt(0) * 5}, 50%, 40%)` }}>
                        {task.assignee.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      {activities.length > 0 && (
        <div className="card activity-card animate-in" style={{ animationDelay: '0.35s', marginTop: 20 }}>
          <div className="section-header">
            <Activity size={16} style={{ color: 'var(--accent-light)' }} />
            <h2 className="section-title">Recent Activity</h2>
            <Link to="/activity" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>View All</Link>
          </div>
          <div className="activity-timeline">
            {activities.slice(0, 6).map(act => (
              <div key={act.id} className="activity-item">
                <div className="activity-dot" style={{ background: act.action.includes('delete') ? 'var(--red)' : act.action.includes('create') ? 'var(--green)' : 'var(--accent)' }}></div>
                <div className="activity-content">
                  <span className="activity-user">{act.user?.name}</span>
                  <span className="activity-action"> {actionLabels[act.action] || act.action}</span>
                  {act.details?.taskTitle && <span className="activity-target"> "{act.details.taskTitle}"</span>}
                  {act.details?.projectName && <span className="activity-target"> "{act.details.projectName}"</span>}
                  {act.details?.memberName && <span className="activity-target"> {act.details.memberName}</span>}
                </div>
                <span className="activity-time">{format(new Date(act.createdAt), 'MMM d, HH:mm')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Users should only see their assigned tasks
  if (!user?.isAdmin) {
    return <UserDashboard user={user} />;
  }

  // Admin sees all projects and tasks
  return <AdminDashboard user={user} />;
}
