import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Send, Calendar, User, Tag, Edit3, Check } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatusBadge = ({ status }) => {
  const labels = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
};

export default function TaskDetailModal({ task, project, isAdmin, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignee: task.assignee?.id || '',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    tags: task.tags?.join(', ') || ''
  });
  const [comment, setComment] = useState('');

  // Fetch fresh task to get updated comments
  const { data: freshTask, refetch } = useQuery({
    queryKey: ['task', task.id],
    queryFn: () => api.get(`/tasks/${task.id}`).then(r => r.data.task),
    initialData: task,
    staleTime: 0
  });

  // Admin fetches ALL users so they can reassign to anyone
  const { data: allUsersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users').then(r => r.data),
    enabled: !!user?.isAdmin
  });

  // For admin: show all DB users; for regular user: only project members
  const assigneeList = user?.isAdmin && allUsersData?.users
    ? allUsersData.users.map(u => ({ id: u.id, name: u.name }))
    : (project.members || []).map(m => ({ id: m.user.id, name: m.user.name }));

  const displayTask = freshTask || task;

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/tasks/${task.id}`, data),
    onSuccess: (res) => {
      toast.success('Task updated');
      setEditMode(false);
      onUpdated(res.data.task);
      refetch();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task.id}`),
    onSuccess: () => { toast.success('Task deleted'); onDeleted(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const commentMutation = useMutation({
    mutationFn: (text) => api.post(`/tasks/${task.id}/comments`, { text }),
    onSuccess: () => {
      setComment('');
      refetch(); // Refresh to show new comment
      queryClient.invalidateQueries(['tasks']);
      toast.success('Comment added');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Comment failed')
  });

  const handleSave = (e) => {
    e.preventDefault();
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    updateMutation.mutate({
      ...form,
      assignee: form.assignee || null,
      dueDate: form.dueDate || null,
      tags
    });
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate(comment.trim());
  };

  const canEdit = isAdmin || task.createdById === user?.id || task.assignee?.id === user?.id;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={displayTask.status} />
            <span className={`badge badge-${displayTask.priority}`}>{displayTask.priority}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canEdit && !editMode && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>
                <Edit3 size={13} /> Edit
              </button>
            )}
            {(isAdmin || task.createdById === user?.id) && (
              <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                <Trash2 size={13} />
              </button>
            )}
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {assigneeList.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-input" placeholder="bug, frontend" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                <Check size={14} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {displayTask.title}
            </h2>

            {displayTask.description && (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.7 }}>
                {displayTask.description}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 18 }}>
              {displayTask.assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <User size={13} style={{ color: 'var(--text-dim)' }} />
                  <div className="avatar avatar-sm"
                    style={{ background: `hsl(${displayTask.assignee.name?.charCodeAt(0)*5||200}, 50%, 35%)` }}>
                    {displayTask.assignee.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{displayTask.assignee.name}</span>
                </div>
              )}
              {displayTask.dueDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                  <Calendar size={13} style={{ color: 'var(--text-dim)' }} />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {format(new Date(displayTask.dueDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {displayTask.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
                <Tag size={13} style={{ color: 'var(--text-dim)' }} />
                {displayTask.tags.map(tag => (
                  <span key={tag} style={{
                    background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                    padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: '1px solid var(--border)'
                  }}>{tag}</span>
                ))}
              </div>
            )}

            <hr className="divider" />

            {/* Comments */}
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Comments ({displayTask.comments?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 220, overflowY: 'auto' }}>
                {(displayTask.comments || []).map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                    <div className="avatar avatar-sm" style={{ flexShrink: 0, background: `hsl(${c.author?.name?.charCodeAt(0)*5||200}, 50%, 35%)` }}>
                      {c.author?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 13 }}>{c.author?.name}</strong>
                        <span style={{ color: 'var(--text-dim)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                          {format(new Date(c.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                        background: 'var(--bg-elevated)', padding: '8px 12px',
                        borderRadius: 8, border: '1px solid var(--border)'
                      }}>{c.text}</div>
                    </div>
                  </div>
                ))}
                {(displayTask.comments || []).length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '16px 0' }}>No comments yet</p>
                )}
              </div>
              <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
                <input
                  id="comment-input"
                  className="form-input" placeholder="Add a comment..."
                  value={comment} onChange={e => setComment(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!comment.trim() || commentMutation.isPending}>
                  <Send size={13} /> {commentMutation.isPending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
