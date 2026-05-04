import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Trash2, ChevronLeft, GripVertical } from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import ManageMembersModal from '../components/ManageMembersModal';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#94a3b8' },
  { key: 'in-progress', label: 'In Progress', color: '#38bdf8' },
  { key: 'review', label: 'Review', color: '#fbbf24' },
  { key: 'done', label: 'Done', color: '#34d399' },
];

function SortableTaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const assignee = task.assignedTo;

  return (
    <div ref={setNodeRef} style={style} className={`task-card ${isDragging ? 'dragging' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div {...attributes} {...listeners}
          style={{ color: 'var(--text-dim)', cursor: 'grab', marginTop: '2px', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1 }} onClick={onClick}>
          <p className="task-card-title">{task.title}</p>
          <div className="task-card-meta">
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {task.dueDate && (
                <span className={`task-card-due ${isOverdue ? 'overdue' : ''}`}>
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
              {assignee && (
                <div className="avatar avatar-sm" title={assignee.name}>
                  {assignee.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCardPreview({ task }) {
  return (
    <div className="task-card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7)', opacity: 0.95, transform: 'rotate(3deg) scale(1.03)' }}>
      <p className="task-card-title">{task.title}</p>
      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, loginRole } = useAuth();
  const isGlobalAdmin = loginRole === 'admin';
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project=${id}`)
    ]).then(([pRes, tRes]) => {
      setProject(pRes.data);
      setTasks(tRes.data);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const userMember = project?.members.find(m => m.user?._id === user._id || m.user === user._id);
  const isAdmin = userMember?.role === 'Admin' && isGlobalAdmin;

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const getColumnTasks = status => filteredTasks.filter(t => t.status === status);

  const handleTaskCreated = task => {
    setTasks(prev => [task, ...prev]);
    setShowCreateTask(false);
  };

  const handleTaskUpdated = updated => {
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
    setSelectedTask(null);
  };

  const handleDeleteTask = async taskId => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragOver = ({ over }) => {
    if (!over) { setOverColumn(null); return; }
    const colKey = COLUMNS.find(c => c.key === over.id)?.key
      || tasks.find(t => t._id === over.id)?.status;
    setOverColumn(colKey || null);
  };

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    // Determine target column
    const targetCol = COLUMNS.find(c => c.key === overId)?.key
      || tasks.find(t => t._id === overId)?.status;

    if (!targetCol) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === targetCol) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: targetCol } : t));

    try {
      const res = await api.put(`/tasks/${taskId}`, { status: targetCol });
      setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
      toast.success(`Moved to ${COLUMNS.find(c => c.key === targetCol)?.label}`);
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t._id === taskId ? task : t));
      toast.error('Failed to update task status');
    }
  }, [tasks]);

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  if (loading) return (
    <div className="page-content">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ borderRadius: 14, border: '1px solid var(--border)', padding: 16 }}>
            <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 16 }} />
            {[...Array(3)].map((_, j) => <div key={j} className="skeleton skeleton-card" style={{ height: 80 }} />)}
          </div>
        ))}
      </div>
    </div>
  );
  if (!project) return null;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon" onClick={() => navigate('/projects')}><ChevronLeft size={18} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: project.color, boxShadow: `0 0 10px ${project.color}80` }} />
            <div>
              <h1>{project.name}</h1>
              <p>{tasks.length} tasks Â· {progress}% complete</p>
            </div>
          </div>
        </div>
        <div className="topbar-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar" style={{ width: '100px' }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px' }}>{progress}%</span>
          </div>
          {isAdmin ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowMembers(true)}>
              <Users size={15} /> Members ({project.members.length})
            </button>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={14} /> {project.members.length} members
            </span>
          )}
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>
              <Plus size={15} /> Add Task
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
              Board
            </button>
            <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
              List
            </button>
          </div>
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 12px' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 12px' }}
            value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          {(filterStatus || filterPriority) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>
              Clear filters
            </button>
          )}
        </div>

        {activeTab === 'board' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="kanban-board">
              {COLUMNS.map(col => {
                const colTasks = getColumnTasks(col.key);
                return (
                  <SortableContext key={col.key} items={colTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    <div
                      className={`kanban-col ${overColumn === col.key && activeId ? 'drag-over' : ''}`}
                      id={col.key}
                      data-col={col.key}
                    >
                      <div className="kanban-col-header">
                        <div className="kanban-col-title">
                          <div className="kanban-col-dot" style={{ background: col.color, boxShadow: `0 0 6px ${col.color}80` }} />
                          {col.label}
                        </div>
                        <span className="kanban-col-count">{colTasks.length}</span>
                      </div>

                      {colTasks.map(task => (
                        <SortableTaskCard
                          key={task._id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))}

                      {colTasks.length === 0 && (
                        <div style={{
                          border: '2px dashed var(--border)',
                          borderRadius: 10,
                          padding: '20px',
                          textAlign: 'center',
                          color: 'var(--text-dim)',
                          fontSize: '12px',
                          transition: 'var(--transition)',
                          background: overColumn === col.key && activeId ? 'rgba(99,102,241,0.05)' : 'transparent',
                        }}>
                          Drop tasks here
                        </div>
                      )}

                      {isAdmin && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ width: '100%', justifyContent: 'center', marginTop: '10px', borderStyle: 'dashed' }}
                          onClick={() => setShowCreateTask(true)}
                        >
                          <Plus size={13} /> Add task
                        </button>
                      )}
                    </div>
                  </SortableContext>
                );
              })}
            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
              {activeTask ? <TaskCardPreview task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>No tasks found</td></tr>
                ) : filteredTasks.map(task => {
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                  return (
                    <tr key={task._id} onClick={() => setSelectedTask(task)}>
                      <td>
                        <p style={{ fontWeight: 600 }}>{task.title}</p>
                        {task.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                            {task.tags.map(t => (
                              <span key={t} style={{ fontSize: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', padding: '2px 7px', borderRadius: '8px', fontWeight: 600 }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>
                        {task.assignedTo
                          ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="avatar avatar-sm">{task.assignedTo.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                              <span style={{ fontSize: '13px' }}>{task.assignedTo.name}</span>
                            </div>
                          : <span style={{ color: 'var(--text-dim)' }}>â€”</span>}
                      </td>
                      <td style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'â€”'}
                      </td>
                      {isAdmin && (
                        <td onClick={e => e.stopPropagation()}>
                          <button className="btn btn-danger btn-xs" onClick={() => handleDeleteTask(task._id)}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateTask && (
        <CreateTaskModal projectId={id} members={project.members} onClose={() => setShowCreateTask(false)} onCreated={handleTaskCreated} />
      )}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} members={project.members} isAdmin={isAdmin} onClose={() => setSelectedTask(null)} onUpdated={handleTaskUpdated} />
      )}
      {showMembers && (
        <ManageMembersModal project={project} isAdmin={isAdmin} onClose={() => setShowMembers(false)} onUpdated={setProject} />
      )}
    </>
  );
}
