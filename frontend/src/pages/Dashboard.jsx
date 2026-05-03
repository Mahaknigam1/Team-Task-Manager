import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/tasks/me/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;
  if (!data) return <div className="text-slate-500">No data available.</div>;

  const { stats, recentTasks, projects } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Your tasks across all projects</p>
        </div>
        <Link to="/projects" className="btn-primary">
          View projects →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Assigned" value={stats.totalAssigned} icon="📋" accent="brand" />
        <StatCard label="To do" value={stats.todo} icon="📝" accent="slate" />
        <StatCard label="In progress" value={stats.inProgress} icon="⚡" accent="yellow" />
        <StatCard label="Done" value={stats.done} icon="✅" accent="green" />
        <StatCard label="Overdue" value={stats.overdue} icon="⏰" accent="red" />
        <StatCard label="Projects" value={stats.projectsCount} icon="📁" accent="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent tasks</h2>
            <span className="text-xs text-slate-500">Assigned to you</span>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No tasks assigned yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentTasks.map((t) => (
                <li key={t._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project?._id}`}
                      className="font-medium text-slate-800 hover:text-brand-600 block truncate"
                    >
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500 truncate">
                      {t.project?.name || 'Project'}
                    </div>
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      t.status === 'done'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'in-progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Your projects</h2>
            <span className="text-xs text-slate-500">{projects.length} total</span>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No projects yet.{' '}
              <Link to="/projects" className="text-brand-600 hover:underline">
                Create one
              </Link>
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projects.map((p) => (
                <li key={p._id}>
                  <Link
                    to={`/projects/${p._id}`}
                    className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 truncate"
                  >
                    📁 {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
