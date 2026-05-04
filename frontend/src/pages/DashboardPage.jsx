import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format, isPast, isToday } from 'date-fns';
import { FolderKanban, CheckSquare, AlertCircle, TrendingUp, Clock, Plus } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCard({ icon, label, value, color, bg }) {
  const animated = useCountUp(value);
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}>{icon}</div>
      <div className="stat-info">
        <h3 className="counter" style={{ color }}>{animated}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loginRole } = useAuth();
  const isGlobalAdmin = loginRole === 'admin';
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/tasks/my')
    ]).then(([pRes, tRes]) => {
      setProjects(pRes.data);
      setMyTasks(tRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    totalProjects: projects.length,
    totalTasks: myTasks.length,
    doneTasks: myTasks.filter(t => t.status === 'done').length,
    overdueTasks: myTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length,
  };

  const recentTasks = myTasks.slice(0, 6);
  const recentProjects = projects.slice(0, 4);

  if (loading) return (
    <div className="page-content">
      <div className="stats-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-title" style={{ width: '50%' }} />
              <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: 20 }} />
            {[...Array(4)].map((_, j) => <div key={j} className="skeleton skeleton-text" style={{ marginBottom: 12 }} />)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Dashboard</h1>
          <p>Welcome back, <strong style={{ color: 'var(--primary-light)' }}>{user?.name}</strong>! Here's what's happening.</p>
        </div>
        <div className="topbar-actions">
          {isGlobalAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreateProject(true)}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard
            icon={<FolderKanban size={22} color="var(--primary-light)" />}
            label="Total Projects"
            value={stats.totalProjects}
            color="var(--primary-light)"
            bg="rgba(99,102,241,0.15)"
          />
          <StatCard
            icon={<CheckSquare size={22} color="#38bdf8" />}
            label="Assigned Tasks"
            value={stats.totalTasks}
            color="#38bdf8"
            bg="rgba(14,165,233,0.15)"
          />
          <StatCard
            icon={<TrendingUp size={22} color="#34d399" />}
            label="Tasks Completed"
            value={stats.doneTasks}
            color="#34d399"
            bg="rgba(16,185,129,0.15)"
          />
          <StatCard
            icon={<AlertCircle size={22} color="#f87171" />}
            label="Overdue Tasks"
            value={stats.overdueTasks}
            color={stats.overdueTasks > 0 ? 'var(--danger)' : undefined}
            bg="rgba(239,68,68,0.15)"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Projects */}
          <div>
            <div className="section-header">
              <h2 className="section-title">Recent Projects</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>View all</button>
            </div>
            {recentProjects.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <p>No projects yet. Create one to get started!</p>
              </div>
            ) : (
              recentProjects.map((p, i) => (
                <div key={p._id} className="card card-sm"
                  style={{ marginBottom: '10px', cursor: 'pointer', animationDelay: `${i * 60}ms`, animation: 'pageFadeIn 0.4s ease both', borderLeft: `3px solid ${p.color}` }}
                  onClick={() => navigate(`/projects/${p._id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}80`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px' }}>{p.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* My Tasks */}
          <div>
            <div className="section-header">
              <h2 className="section-title">My Tasks</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-tasks')}>View all</button>
            </div>
            {recentTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <p>No tasks assigned to you yet.</p>
              </div>
            ) : (
              recentTasks.map((t, i) => {
                const isOverdue = t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done';
                return (
                  <div key={t._id} className="card card-sm"
                    style={{ marginBottom: '10px', cursor: 'pointer', animationDelay: `${i * 60}ms`, animation: 'pageFadeIn 0.4s ease both' }}
                    onClick={() => navigate('/my-tasks')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{t.title}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className={`badge badge-${t.status}`}>{t.status}</span>
                          <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                          {t.project && (
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.project.name}</span>
                          )}
                        </div>
                      </div>
                      {t.dueDate && (
                        <div style={{ fontSize: '11px', color: isOverdue ? 'var(--danger)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, fontWeight: isOverdue ? 700 : 400 }}>
                          <Clock size={11} />
                          {isToday(new Date(t.dueDate)) ? 'Today' : format(new Date(t.dueDate), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreated={p => { setProjects([p, ...projects]); setShowCreateProject(false); }}
        />
      )}
    </>
  );
}
