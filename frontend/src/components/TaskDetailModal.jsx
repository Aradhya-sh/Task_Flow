import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, MessageSquare, Calendar, User, Tag, Edit2, Check } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function TaskDetailModal({ task: initialTask, members, onClose, onUpdated, isAdmin }) {
  const { user } = useAuth();
  const [task, setTask] = useState(initialTask);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: initialTask.title,
    description: initialTask.description || '',
    status: initialTask.status,
    priority: initialTask.priority,
    assignedTo: initialTask.assignedTo?._id || '',
    dueDate: initialTask.dueDate ? initialTask.dueDate.split('T')[0] : '',
    tags: (initialTask.tags || []).join(', ')
  });
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      const res = await api.put(`/tasks/${task._id}`, payload);
      setTask(res.data);
      setEditing(false);
      toast.success('Task updated');
      onUpdated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await api.put(`/tasks/${task._id}`, { status });
      setTask(res.data);
      setForm(f => ({ ...f, status: res.data.status }));
      onUpdated(res.data);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: comment });
      setTask(prev => ({ ...prev, comments: [...(prev.comments || []), res.data] }));
      setComment('');
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const initials = n => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 style={{ flex: 1, marginRight: '16px', fontSize: '16px' }}>
            {editing && isAdmin
              ? <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              : task.title}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isAdmin && !editing && <button className="btn-icon" onClick={() => setEditing(true)}><Edit2 size={15} /></button>}
            {editing && <button className="btn-icon" onClick={handleSave} disabled={saving}><Check size={15} /></button>}
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '24px' }}>
          {/* Main Content */}
          <div>
            <div className="form-group">
              <label className="form-label">Description</label>
              {editing && isAdmin
                ? <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                : <p style={{ fontSize: '14px', color: task.description ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.6 }}>
                    {task.description || 'No description provided.'}
                  </p>}
            </div>

            {task.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {task.tags.map(tag => (
                  <span key={tag} style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <MessageSquare size={14} /> Comments ({task.comments?.length || 0})
              </label>

              <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                {task.comments?.length === 0
                  ? <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No comments yet.</p>
                  : task.comments?.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <div className="avatar avatar-sm">{initials(c.user?.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.user?.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.text}</p>
                      </div>
                    </div>
                  ))
                }
              </div>

              <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px' }}>
                <input className="form-input" placeholder="Write a comment..." value={comment}
                  onChange={e => setComment(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary btn-sm" disabled={commenting || !comment.trim()}>
                  {commenting ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status}
                onChange={e => { setForm({ ...form, status: e.target.value }); if (!editing) handleStatusChange(e.target.value); }}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {isAdmin && (
              <div className="form-group">
                <label className="form-label">Priority</label>
                {editing
                  ? <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  : <span className={`badge badge-${task.priority}`}>{task.priority}</span>}
              </div>
            )}

            {isAdmin && (
              <div className="form-group">
                <label className="form-label">Assign To</label>
                {editing
                  ? <select className="form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                    </select>
                  : task.assignedTo
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar avatar-sm">{initials(task.assignedTo.name)}</div>
                        <span style={{ fontSize: '13px' }}>{task.assignedTo.name}</span>
                      </div>
                    : <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Unassigned</span>}
              </div>
            )}

            {!isAdmin && task.assignedTo && (
              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar avatar-sm">{initials(task.assignedTo.name)}</div>
                  <span style={{ fontSize: '13px' }}>{task.assignedTo.name}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Due Date</label>
              {editing && isAdmin
                ? <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                : task.dueDate
                  ? <span style={{ fontSize: '13px', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {format(new Date(task.dueDate), 'MMM d, yyyy')} {isOverdue && '⚠ Overdue'}
                    </span>
                  : <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No due date</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Created By</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="avatar avatar-sm">{initials(task.createdBy?.name)}</div>
                <span style={{ fontSize: '13px' }}>{task.createdBy?.name}</span>
              </div>
            </div>

            {editing && isAdmin && (
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input className="form-input" placeholder="frontend, bug" value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
