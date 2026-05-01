import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#6366f1'];

export default function CreateProjectModal({ onClose }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], dueDate: '' });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Project created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, dueDate: form.dueDate || undefined });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input id="project-name" className="form-input" placeholder="e.g. Website Redesign"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required minLength={2} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What is this project about?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <button key={color} type="button"
                  style={{
                    width: 30, height: 30, borderRadius: '50%', background: color,
                    border: form.color === color ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: form.color === color ? `2px solid ${color}` : 'none',
                    transition: 'all 0.15s', boxShadow: form.color === color ? `0 0 12px ${color}60` : 'none'
                  }}
                  onClick={() => setForm(f => ({ ...f, color }))}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="create-project-btn" type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
