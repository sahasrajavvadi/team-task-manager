import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderKanban, CheckCircle2, AlertTriangle, MoreVertical, Trash2, Archive } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect non-admins to dashboard
  if (!user?.isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['projects']); toast.success('Project deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete')
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/projects/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries(['projects']); toast.success('Project updated'); }
  });

  const handleDelete = (project) => {
    if (window.confirm(`Delete "${project.name}"? This will also delete all tasks.`)) {
      deleteMutation.mutate(project.id);
    }
  };

  const projects = data?.projects || [];
  const isOwner = (project) => project.owner?.id === user?.id;
  const activeProjects = projects.filter(p => p.status !== 'archived');
  const archivedProjects = projects.filter(p => p.status === 'archived');

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="projects-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton project-skeleton" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Create your first project to start organizing tasks</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <>
          {activeProjects.length > 0 && (
            <div className="projects-grid">
              {activeProjects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isOwner={isOwner(project)}
                  onDelete={handleDelete}
                  onArchive={(p) => archiveMutation.mutate({ id: p.id, status: 'archived' })}
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          )}

          {archivedProjects.length > 0 && (
            <>
              <h2 className="section-divider">Archived</h2>
              <div className="projects-grid">
                {archivedProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isOwner={isOwner(project)}
                    onDelete={handleDelete}
                    onArchive={(p) => archiveMutation.mutate({ id: p.id, status: 'active' })}
                    archived
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function ProjectCard({ project, isOwner, onDelete, onArchive, archived, style }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = project.taskCounts?.total > 0
    ? Math.round((project.taskCounts.done / project.taskCounts.total) * 100)
    : 0;

  return (
    <div className={`project-card animate-in ${archived ? 'archived' : ''}`} style={style}>
      <div className="project-card-top">
        <div className="project-color-strip" style={{ background: project.color }}></div>
        <div className="project-actions">
          {project.overdueCount > 0 && (
            <span className="overdue-pill">
              <AlertTriangle size={10} /> {project.overdueCount} overdue
            </span>
          )}
          {isOwner && (
            <div className="menu-wrapper">
              <button className="btn btn-ghost btn-icon btn-sm menu-trigger"
                onClick={(e) => { e.preventDefault(); setMenuOpen(v => !v); }}>
                <MoreVertical size={14} />
              </button>
              {menuOpen && (
                <div className="dropdown-menu" onMouseLeave={() => setMenuOpen(false)}>
                  <button className="dropdown-item" onClick={() => { onArchive(project); setMenuOpen(false); }}>
                    <Archive size={13} /> {archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button className="dropdown-item danger" onClick={() => { onDelete(project); setMenuOpen(false); }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Link to={`/projects/${project.id}`} className="project-link">
        <h3 className="project-name">{project.name}</h3>
        {project.description && <p className="project-desc">{project.description}</p>}
      </Link>

      <div className="project-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: project.color }}></div>
        </div>
        <span className="progress-text">{progress}%</span>
      </div>

      <div className="project-footer">
        <div className="project-stats">
          <span className="pstat">
            <CheckCircle2 size={12} /> {project.taskCounts?.done || 0}/{project.taskCounts?.total || 0} done
          </span>
        </div>
        <div className="member-stack">
          {project.members?.slice(0, 4).map(m => (
            <div key={m.user.id} className="avatar avatar-sm stacked" title={m.user.name}
              style={{ background: `hsl(${m.user.name?.charCodeAt(0) * 5}, 50%, 35%)` }}>
              {m.user.name?.slice(0, 2).toUpperCase()}
            </div>
          ))}
          {project.members?.length > 4 && (
            <div className="avatar avatar-sm stacked more-count">+{project.members.length - 4}</div>
          )}
        </div>
      </div>
    </div>
  );
}
