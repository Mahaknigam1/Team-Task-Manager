import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import Modal from '../components/Modal.jsx';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/projects')
      .then((res) => setProjects(res.data.projects))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created');
      setOpen(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-sm text-slate-500">Manage your projects and teams</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          + New project
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📁</div>
          <h3 className="font-semibold text-slate-800">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-4">Create your first project to start tracking tasks.</p>
          <button onClick={() => setOpen(true)} className="btn-primary">
            Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const progress = p.taskCount
              ? Math.round((p.completedCount / p.taskCount) * 100)
              : 0;
            return (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="card p-5 hover:shadow-md transition block"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  <span
                    className={`badge ${
                      p.myRole === 'admin'
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {p.myRole}
                  </span>
                </div>
                {p.description && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.description}</p>
                )}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>
                      {p.completedCount}/{p.taskCount} tasks
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  👥 {p.members?.length || 0} members
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create project"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button form="create-project" type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </>
        }
      >
        <form id="create-project" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="e.g. Website redesign"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input"
              placeholder="Optional"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
