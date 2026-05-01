import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function CreateTaskModal({ projectId, defaultStatus, members, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '',
    status: defaultStatus || 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    tags: ''
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Admin fetches ALL users from the database so they can assign tasks to anyone
  const { data: allUsersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users').then(r => r.data),
    enabled: !!user?.isAdmin
  });

  // For admin: show all database users; for regular user: show only project members
  const assigneeList = user?.isAdmin && allUsersData?.users
    ? allUsersData.users.map(u => ({ id: u.id, name: u.name, email: u.email }))
    : (members || []).map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email }));

  const mutation = useMutation({
    mutationFn: (data) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId]);
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['project', projectId]);
      toast.success('Task created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create task')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    mutation.mutate({
      ...form,
      project: projectId,
      assignee: form.assignee || undefined,
      dueDate: form.dueDate || undefined,
      tags
    });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input id="task-title" className="form-input" placeholder="What needs to be done?"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required minLength={2} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Add details..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} />
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
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" placeholder="bug, frontend, urgent"
              value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="create-task-btn" type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
