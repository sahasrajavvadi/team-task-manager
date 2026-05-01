import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import ManageMembersModal from '../components/ManageMembersModal';
import './ProjectDetailPage.css';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#64748b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', label: 'In Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showCreateTask, setShowCreateTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragTaskRef = useRef(null);

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data)
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get('/tasks', { params: { project: id } }).then(r => r.data)
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => api.put(`/tasks/${taskId}`, data),
    onSuccess: () => queryClient.invalidateQueries(['tasks', id]),
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const project = projectData?.project;
  const tasks = tasksData?.tasks || [];

  const userMember = project?.members?.find(m => m.user?.id === user?.id);
  const isAdmin = userMember?.role === 'admin' || project?.owner?.id === user?.id;

  const filteredTasks = tasks.filter(task => {
    const matchSearch = !search || task.title.toLowerCase().includes(search.toLowerCase());
    const matchAssignee = !filterAssignee || task.assignee?.id === filterAssignee;
    return matchSearch && matchAssignee;
  });

  const getColumnTasks = (status) => filteredTasks.filter(t => t.status === status);

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    dragTaskRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDragOverCol(null);
    dragTaskRef.current = null;
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const task = dragTaskRef.current;
    if (!task || task.status === newStatus) return;
    updateTaskMutation.mutate({ taskId: task.id, data: { status: newStatus } });
    toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`);
  };

  if (projectLoading) return <div className="page-loading"><div className="loader"></div></div>;
  if (!project) return (
    <div className="project-detail-page">
      <div className="empty-state">
        <h3>Project not found</h3>
        <Link to="/projects" className="btn btn-secondary" style={{ marginTop: 16 }}>Back to Projects</Link>
      </div>
    </div>
  );

  return (
    <div className="project-detail-page">
      <div className="project-header">
        <div className="project-header-left">
          <Link to="/projects" className="back-link">
            <ArrowLeft size={16} /> Projects
          </Link>
          <div className="project-title-row">
            <div className="project-color-dot" style={{ background: project.color }}></div>
            <h1 className="project-title-text">{project.name}</h1>
            {project.status === 'archived' && <span className="badge badge-todo">Archived</span>}
          </div>
          {project.description && <p className="project-description">{project.description}</p>}
        </div>
        <div className="project-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>
            <Users size={14} />
            <span>{project.members?.length} member{project.members?.length !== 1 ? 's' : ''}</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask('todo')}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, minHeight: 'calc(100vh - 250px)' }}>
        {/* Members Sidebar */}
        <div style={{
          width: 200,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 16,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 350px)'
        }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 12 }}>
            👥 Team Members
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {project.members?.map(member => {
              const memberTaskCount = tasks.filter(t => t.assigneeId === member.user.id).length;
              const isCurrentUser = member.user.id === user?.id;
              return (
                <div
                  key={member.user.id}
                  onClick={() => setFilterAssignee(member.user.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: filterAssignee === member.user.id ? 'var(--accent-glow)' : 'transparent',
                    border: filterAssignee === member.user.id ? '1px solid var(--accent)' : '1px solid transparent'
                  }}
                  onMouseEnter={e => {
                    if (filterAssignee !== member.user.id) {
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (filterAssignee !== member.user.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div className="avatar" style={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      fontSize: 11,
                      background: `hsl(${member.user.name?.charCodeAt(0)*5||200}, 50%, 35%)`
                    }}>
                      {member.user.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.user.name}
                        {isCurrentUser && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}> (you)</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {memberTaskCount} {memberTaskCount === 1 ? 'task' : 'tasks'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Filters */}
          <div className="board-filters">
            <div className="search-wrapper">
              <Search size={14} className="search-icon" />
              <input
                id="task-search"
                className="search-input"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              id="assignee-filter"
              className="form-select filter-select"
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
            >
              <option value="">All members</option>
              {project.members?.map(m => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
            {(search || filterAssignee) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterAssignee(''); }}>
                Clear
              </button>
            )}
          </div>

          {/* Kanban Board */}
          <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = getColumnTasks(col.id);
          const isDragTarget = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className={`kanban-column ${isDragTarget ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
            >
              <div className="column-header">
                <div className="column-title-row">
                  <div className="col-dot" style={{ background: col.color }}></div>
                  <span className="column-title">{col.label}</span>
                  <span className="column-count">{colTasks.length}</span>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm add-task-btn"
                  onClick={() => setShowCreateTask(col.id)} title="Add task">
                  <Plus size={14} />
                </button>
              </div>

              <div className="column-tasks">
                {tasksLoading ? (
                  <div className="skeleton" style={{ height: 80 }} />
                ) : colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    isAdmin={isAdmin}
                    userId={user?.id}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
                {!tasksLoading && colTasks.length === 0 && (
                  <div className={`col-empty ${isDragTarget ? 'drag-target' : ''}`}>
                    {isDragTarget ? 'Drop here' : 'No tasks'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
            </div> {/* Close kanban-board */}
        </div> {/* Close main content div */}
      </div> {/* Close flex container */}

      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          defaultStatus={showCreateTask}
          members={project.members}
          onClose={() => setShowCreateTask(null)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          project={project}
          isAdmin={isAdmin}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            setSelectedTask(updated);
            queryClient.invalidateQueries(['tasks', id]);
          }}
          onDeleted={() => {
            setSelectedTask(null);
            queryClient.invalidateQueries(['tasks', id]);
          }}
        />
      )}

      {showMembers && (
        <ManageMembersModal
          project={project}
          isAdmin={isAdmin}
          userId={user?.id}
          onClose={() => { setShowMembers(false); queryClient.invalidateQueries(['project', id]); }}
        />
      )}
    </div>
  );
}
