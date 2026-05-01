import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, UserPlus, Crown, UserMinus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ManageMembersModal({ project, isAdmin, userId, onClose }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showUserList, setShowUserList] = useState(false);

  // Fetch all available users
  const { data: usersData } = useQuery({
    queryKey: ['available-users'],
    queryFn: () => api.get('/users').then(r => r.data)
  });

  // Filter users who are not already in the project
  const availableUsers = (usersData?.users || []).filter(
    u => !project.members?.some(m => m.user.id === u.id)
  );

  const addMutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${project.id}/members`, data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setInviteEmail('');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add member')
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => api.delete(`/projects/${project.id}/members/${memberId}`),
    onSuccess: () => { toast.success('Member removed'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove')
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }) => api.put(`/projects/${project.id}/members/${memberId}`, { role }),
    onSuccess: () => { toast.success('Role updated'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role')
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    addMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleSelectUser = (user) => {
    setInviteEmail(user.email);
    setShowUserList(false);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Team Members</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {isAdmin && (
          <div style={{ marginBottom: 20 }}>
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  id="invite-email"
                  className="form-input"
                  placeholder="Select or type email..."
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onFocus={() => setShowUserList(true)}
                  onBlur={() => setTimeout(() => setShowUserList(false), 200)}
                  style={{ width: '100%' }}
                  required
                />
                
                {/* Available Users Dropdown */}
                {showUserList && availableUsers.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: 4,
                    maxHeight: 200,
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {availableUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          textAlign: 'left',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)',
                          transition: 'background 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="avatar" style={{ width: 28, height: 28, minWidth: 28, fontSize: 11, background: `hsl(${user.name?.charCodeAt(0)*5||200}, 50%, 35%)` }}>
                          {user.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500 }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select className="form-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: 110 }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button id="invite-btn" type="submit" className="btn btn-primary" disabled={addMutation.isPending}>
                <UserPlus size={14} />
              </button>
            </form>
            
            {availableUsers.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                ✓ All users are already members of this project
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {project.members?.map(m => {
            const isOwner = project.owner?.id === m.user.id;
            const isSelf = m.user.id === userId;
            return (
              <div key={m.user.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                borderRadius: 8, transition: 'background 0.15s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="avatar avatar-md" style={{ background: `hsl(${m.user.name?.charCodeAt(0)*5||200}, 50%, 35%)` }}>
                  {m.user.name?.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.user.name}
                    {isSelf && <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 12 }}>(you)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isOwner ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>
                      <Crown size={12} /> Owner
                    </span>
                  ) : isAdmin ? (
                    <select className="form-select"
                      value={m.role}
                      onChange={e => updateRoleMutation.mutate({ memberId: m.user.id, role: e.target.value })}
                      style={{ width: 100, padding: '4px 8px', fontSize: 12 }}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                  )}
                  {!isOwner && (isAdmin || isSelf) && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--text-dim)' }}
                      onClick={() => removeMutation.mutate(m.user.id)}
                      title={isSelf ? 'Leave project' : 'Remove member'}
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
