import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, Trash2, Crown, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ManageMembersModal({ project, isAdmin, onClose, onUpdated }) {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('Member');
  const [adding, setAdding] = useState(false);

  const handleAdd = async e => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setAdding(true);
    try {
      const res = await api.post(`/projects/${project._id}/members`, { email: emailInput.trim(), role: roleInput });
      onUpdated(res.data);
      setEmailInput('');
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async userId => {
    if (!confirm('Remove this member?')) return;
    try {
      const res = await api.delete(`/projects/${project._id}/members/${userId}`);
      onUpdated(res.data);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await api.put(`/projects/${project._id}/members/${userId}/role`, { role });
      onUpdated(res.data);
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const initials = n => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Team Members</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {isAdmin && (
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <input
              className="form-input"
              placeholder="Enter email to invite..."
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <select className="form-select" style={{ width: '120px' }} value={roleInput} onChange={e => setRoleInput(e.target.value)}>
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm" disabled={adding}>
              {adding ? '...' : 'Invite'}
            </button>
          </form>
        )}

        <div>
          {project.members.map((m, i) => {
            const u = m.user;
            const isSelf = u?._id === user._id || u === user._id;
            const isOwner = project.owner?._id === (u?._id || u) || project.owner === (u?._id || u);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="avatar">{initials(u?.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{u?.name}</span>
                    {isOwner && <Crown size={12} color="#fbbf24" title="Owner" />}
                    {isSelf && <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>(you)</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{u?.email}</p>
                </div>
                {isAdmin && !isOwner
                  ? <select className="form-select" style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }}
                      value={m.role} onChange={e => handleRoleChange(u._id, e.target.value)}>
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                  : <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>}
                {isAdmin && !isOwner && (
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleRemove(u._id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
