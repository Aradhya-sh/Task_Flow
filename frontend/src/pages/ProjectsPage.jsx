import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const { user, loginRole } = useAuth();
  const isGlobalAdmin = loginRole === 'admin';
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm('Delete this project? All tasks will also be deleted.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p._id !== projectId));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
    setOpenDropdown(null);
  };

  if (loading) return <div className="loader-center"><div className="spinner" /></div>;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} you're a part of</p>
        </div>
        <div className="topbar-actions">
          {isGlobalAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to start organizing your team's work.</p>
            {isGlobalAdmin && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => {
              const isOwner = p.owner?._id === user._id || p.owner === user._id;
              const userMember = p.members.find(m => m.user?._id === user._id || m.user === user._id);
              const isAdmin = userMember?.role === 'Admin' && isGlobalAdmin;

              return (
                <div key={p._id} className="project-card"
                  style={{ '--project-color': p.color }}
                  onClick={() => navigate(`/projects/${p._id}`)}>
                  <div className="project-card-header">
                    <div>
                      <div className="project-card-title">{p.name}</div>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                    </div>
                    {isAdmin && (
                      <div className="dropdown" onClick={e => e.stopPropagation()}>
                        <button className="btn-icon"
                          onClick={() => setOpenDropdown(openDropdown === p._id ? null : p._id)}>
                          <MoreVertical size={16} />
                        </button>
                        {openDropdown === p._id && (
                          <div className="dropdown-menu">
                            <div className="dropdown-item" onClick={() => navigate(`/projects/${p._id}`)}>
                              <Edit2 size={14} /> Edit Project
                            </div>
                            {isOwner && (
                              <div className="dropdown-item danger" onClick={e => handleDelete(e, p._id)}>
                                <Trash2 size={14} /> Delete
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {p.description && <p className="project-card-desc">{p.description}</p>}

                  <div className="project-card-footer">
                    <div className="member-avatars">
                      {p.members.slice(0, 4).map((m, i) => {
                        const u = m.user;
                        const initials = u?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                        return (
                          <div key={i} className="member-avatar" title={u?.name}>{initials}</div>
                        );
                      })}
                      {p.members.length > 4 && (
                        <div className="member-avatar" style={{ background: 'var(--border)' }}>+{p.members.length - 4}</div>
                      )}
                    </div>
                    {p.dueDate && (
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        Due {format(new Date(p.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => { setProjects([p, ...projects]); setShowCreate(false); }}
        />
      )}
    </>
  );
}
