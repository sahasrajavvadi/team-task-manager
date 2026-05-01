import { useQuery } from '@tanstack/react-query';
import { Activity, GitBranch, MessageSquare, Trash2, Plus, Users, Shield, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import './ActivityPage.css';

const ACTION_CONFIG = {
  task_created:   { icon: Plus,          color: 'var(--green)',  bg: 'var(--green-glow)',  label: 'created task' },
  task_updated:   { icon: GitBranch,     color: 'var(--blue)',   bg: 'var(--blue-glow)',   label: 'updated task' },
  task_deleted:   { icon: Trash2,        color: 'var(--red)',    bg: 'var(--red-glow)',    label: 'deleted task' },
  task_commented: { icon: MessageSquare, color: '#a78bfa',       bg: 'rgba(124,58,237,0.12)', label: 'commented on' },
  project_created:{ icon: FolderKanban,  color: 'var(--green)',  bg: 'var(--green-glow)',  label: 'created project' },
  member_added:   { icon: Users,         color: 'var(--cyan)',   bg: 'rgba(6,182,212,0.1)','label': 'added member' },
  member_removed: { icon: Users,         color: 'var(--red)',    bg: 'var(--red-glow)',    label: 'removed member' },
  role_changed:   { icon: Shield,        color: 'var(--yellow)', bg: 'var(--yellow-glow)', label: 'changed role' },
};

function getDetails(act) {
  const d = act.details || {};
  if (act.action === 'task_created' || act.action === 'task_updated' || act.action === 'task_deleted' || act.action === 'task_commented') {
    return d.taskTitle ? `"${d.taskTitle}"` : '';
  }
  if (act.action === 'project_created') return d.projectName ? `"${d.projectName}"` : '';
  if (act.action === 'member_added') return d.memberName ? `${d.memberName}` : '';
  if (act.action === 'member_removed') return '';
  if (act.action === 'role_changed') return d.newRole ? `→ ${d.newRole}` : '';
  return '';
}

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get('/activity', { params: { limit: 50 } }).then(r => r.data)
  });

  const activities = data?.activities || [];

  return (
    <div className="activity-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="page-subtitle">Track all changes across your projects</p>
        </div>
      </div>

      {isLoading ? (
        <div className="activity-skeleton">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8 }} />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <Activity size={48} />
          <h3>No activity yet</h3>
          <p>Start creating projects and tasks to see activity here</p>
        </div>
      ) : (
        <div className="activity-feed">
          {activities.map((act, i) => {
            const cfg = ACTION_CONFIG[act.action] || ACTION_CONFIG.task_updated;
            const Icon = cfg.icon;
            const initials = act.user?.name?.slice(0, 2).toUpperCase() || '??';
            return (
              <div key={act.id} className="activity-entry animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="activity-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon size={15} />
                </div>
                <div className="activity-body">
                  <div className="activity-main">
                    <div className="avatar avatar-sm" style={{ background: `hsl(${act.user?.name?.charCodeAt(0) * 5 || 200}, 50%, 35%)` }}>
                      {initials}
                    </div>
                    <span className="act-user">{act.user?.name}</span>
                    <span className="act-verb">{cfg.label}</span>
                    {getDetails(act) && <span className="act-target">{getDetails(act)}</span>}
                  </div>
                  <div className="activity-meta">
                    {act.project && (
                      <span className="act-project" style={{ color: act.project.color || 'var(--text-muted)' }}>
                        {act.project.name}
                      </span>
                    )}
                    {act.action === 'task_updated' && act.details?.field === 'status' && (
                      <span className={`badge badge-${act.details.to}`}>{act.details.to?.replace('_', ' ')}</span>
                    )}
                  </div>
                </div>
                <span className="act-time">{format(new Date(act.createdAt), 'MMM d, HH:mm')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
