import { Clock, AlertTriangle, MessageSquare, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import './TaskCard.css';

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

export default function TaskCard({ task, onClick, isAdmin, userId, onDragStart, onDragEnd }) {
  const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isMyTask = task.assignee?.id === userId;

  return (
    <div
      className={`task-card ${isMyTask ? 'my-task' : ''} ${task.status === 'done' ? 'done' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {task.priority !== 'medium' && (
        <div className="task-priority-bar" style={{ background: PRIORITY_COLORS[task.priority] }}></div>
      )}

      <div className="task-card-content">
        <div className="task-card-header">
          <div className="task-drag-handle">
            <GripVertical size={12} />
          </div>
          <div className="task-card-title">{task.title}</div>
        </div>

        {task.tags?.length > 0 && (
          <div className="task-tags">
            {task.tags.slice(0, 3).map(tag => (
              <span key={tag} className="task-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="task-card-footer">
          <div className="task-card-left">
            {task.dueDate && (
              <span className={`due-date ${isOverdue ? 'overdue' : isDueToday ? 'today' : ''}`}>
                {isOverdue && <AlertTriangle size={9} />}
                <Clock size={9} />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          </div>
          <div className="task-card-right">
            {task.comments?.length > 0 && (
              <span className="comment-count">
                <MessageSquare size={10} /> {task.comments.length}
              </span>
            )}
            {task.assignee && (
              <div
                className="avatar avatar-sm task-assignee"
                title={task.assignee.name}
                style={{ background: `hsl(${task.assignee.name?.charCodeAt(0) * 5 || 200}, 50%, 35%)` }}
              >
                {task.assignee.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
