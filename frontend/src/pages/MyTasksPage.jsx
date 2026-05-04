import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format, isPast, isToday } from 'date-fns';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tasks/my').then(res => setTasks(res.data)).finally(() => setLoading(false));
  }, []);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'todo') return t.status === 'todo';
    if (filter === 'in-progress') return t.status === 'in-progress';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'overdue') return t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done';
    return true;
  });

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length,
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>My Tasks</h1>
          <p>Tasks assigned to you across all projects</p>
        </div>
      </div>

      <div className="page-content">
        {/* Quick Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Tasks', icon: '📋' },
            { key: 'todo', label: 'To Do', icon: '🔲' },
            { key: 'in-progress', label: 'In Progress', icon: '⚡' },
            { key: 'done', label: 'Done', icon: '✅' },
            { key: 'overdue', label: 'Overdue', icon: '⚠️' },
          ].map(f => (
            <button key={f.key}
              className={`filter-chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}>
              <span>{f.icon}</span>
              {f.label}
              <span className="filter-chip-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text" style={{ width: '60%' }} /><div className="skeleton skeleton-text" style={{ width: '40%', marginTop: '4px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '70px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '60px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '50px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>No tasks here</h3>
            <p>{filter === 'overdue' ? 'No overdue tasks. Great job!' : 'No tasks in this category.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, i) => {
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                  const dueToday = task.dueDate && isToday(new Date(task.dueDate));
                  return (
                    <tr key={task._id} style={{ cursor: 'pointer', animationDelay: `${i * 40}ms`, animation: 'pageFadeIn 0.35s ease both' }}
                      onClick={() => task.project && navigate(`/projects/${task.project._id}`)}>
                      <td>
                        <p style={{ fontWeight: 600 }}>{task.title}</p>
                        {task.description && (
                          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}
                          </p>
                        )}
                      </td>
                      <td>
                        {task.project ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.project.color, boxShadow: `0 0 6px ${task.project.color}80` }} />
                            <span style={{ fontSize: '13px' }}>{task.project.name}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>
                        {task.dueDate ? (
                          <span style={{ fontSize: '13px', color: isOverdue ? 'var(--danger)' : dueToday ? 'var(--warning)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: isOverdue ? 700 : 400 }}>
                            {isOverdue && <AlertCircle size={12} />}
                            {dueToday && <Clock size={12} />}
                            {isToday(new Date(task.dueDate)) ? 'Today' : format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
