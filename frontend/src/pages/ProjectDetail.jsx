import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import Modal from '../components/Modal.jsx';
import TaskCard from '../components/TaskCard.jsx';

const emptyTask = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  assignedTo: '',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [taskModal, setTaskModal] = useState({ open: false, editing: null });
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [savingTask, setSavingTask] = useState(false);

  const [memberModal, setMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  const isAdmin = project?.myRole === 'admin';

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(pRes.data.project);
      setProjectForm({
        name: pRes.data.project.name,
        description: pRes.data.project.description || '',
      });
      setTasks(tRes.data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project');
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/projects', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'overdue') {
      const now = new Date();
      return tasks.filter(
        (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
      );
    }
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
      ).length,
    };
  }, [tasks]);

  const openCreateTask = () => {
    setTaskForm(emptyTask);
    setTaskModal({ open: true, editing: null });
  };

  const openEditTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedTo: task.assignedTo?._id || '',
    });
    setTaskModal({ open: true, editing: task });
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
        assignedTo: taskForm.assignedTo || null,
      };
      if (taskModal.editing) {
        await api.put(`/tasks/${taskModal.editing._id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post(`/projects/${id}/tasks`, payload);
        toast.success('Task created');
      }
      setTaskModal({ open: false, editing: null });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  const changeTaskStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteTask = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      toast.success('Member added');
      setMemberEmail('');
      setMemberRole('member');
      setMemberModal(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const toggleRole = async (userId, current) => {
    const role = current === 'admin' ? 'member' : 'admin';
    try {
      await api.put(`/projects/${id}/members/${userId}/role`, { role });
      toast.success('Role updated');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}`, projectForm);
      toast.success('Project updated');
      setEditProjectOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteProject = async () => {
    if (!confirm(`Delete project "${project.name}" and all its tasks?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!project) return null;

  const filterBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        filter === key
          ? 'bg-brand-600 text-white'
          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label} <span className="ml-1 opacity-70">({counts[key]})</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to projects
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
              <span
                className={`badge ${
                  project.myRole === 'admin'
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {project.myRole}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-slate-600 mt-2">{project.description}</p>
            )}
            <div className="text-xs text-slate-500 mt-2">
              Created by {project.createdBy?.name} · {project.members?.length || 0} members
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setEditProjectOpen(true)} className="btn-secondary">
                Edit
              </button>
              <button onClick={deleteProject} className="btn-danger">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Team members</h2>
          {isAdmin && (
            <button onClick={() => setMemberModal(true)} className="btn-secondary text-sm">
              + Add member
            </button>
          )}
        </div>
        <ul className="divide-y divide-slate-100">
          {project.members.map((m) => (
            <li key={m.user._id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold shrink-0">
                  {m.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 truncate">{m.user.name}</div>
                  <div className="text-xs text-slate-500 truncate">{m.user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`badge ${
                    m.role === 'admin'
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.role}
                </span>
                {isAdmin && String(m.user._id) !== String(project.createdBy._id) && (
                  <>
                    <button
                      onClick={() => toggleRole(m.user._id, m.role)}
                      className="btn-ghost text-xs"
                      title="Toggle role"
                    >
                      ⇄
                    </button>
                    <button
                      onClick={() => removeMember(m.user._id, m.user.name)}
                      className="btn-ghost text-xs text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-slate-800 text-lg">Tasks</h2>
          {isAdmin && (
            <button onClick={openCreateTask} className="btn-primary">
              + New task
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {filterBtn('all', 'All')}
          {filterBtn('todo', 'To do')}
          {filterBtn('in-progress', 'In progress')}
          {filterBtn('done', 'Done')}
          {filterBtn('overdue', 'Overdue')}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">
            <div className="text-4xl mb-2">📭</div>
            No tasks in this view.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((t) => (
              <TaskCard
                key={t._id}
                task={t}
                canEdit={isAdmin || String(t.assignedTo?._id) !== ''}
                canDelete={isAdmin}
                onEdit={() => openEditTask(t)}
                onDelete={() => deleteTask(t)}
                onStatusChange={(s) => changeTaskStatus(t._id, s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task modal */}
      <Modal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, editing: null })}
        title={taskModal.editing ? 'Edit task' : 'New task'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setTaskModal({ open: false, editing: null })}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button form="task-form" type="submit" disabled={savingTask} className="btn-primary">
              {savingTask ? 'Saving…' : taskModal.editing ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={submitTask} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              required
              minLength={2}
              maxLength={200}
              value={taskForm.title}
              onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              maxLength={2000}
              value={taskForm.description}
              onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
              className="input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
                className="input"
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Assign to</label>
            <select
              value={taskForm.assignedTo}
              onChange={(e) => setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))}
              className="input"
            >
              <option value="">Unassigned</option>
              {project.members.map((m) => (
                <option key={m.user._id} value={m.user._id}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Add member modal */}
      <Modal
        open={memberModal}
        onClose={() => setMemberModal(false)}
        title="Add member"
        footer={
          <>
            <button onClick={() => setMemberModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button form="member-form" type="submit" disabled={addingMember} className="btn-primary">
              {addingMember ? 'Adding…' : 'Add'}
            </button>
          </>
        }
      >
        <form id="member-form" onSubmit={addMember} className="space-y-4">
          <div>
            <label className="label">User email</label>
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="input"
              placeholder="teammate@example.com"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">
              User must already have an account.
            </p>
          </div>
          <div>
            <label className="label">Role</label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="input"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Edit project modal */}
      <Modal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        title="Edit project"
        footer={
          <>
            <button onClick={() => setEditProjectOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button form="edit-project-form" type="submit" className="btn-primary">
              Save
            </button>
          </>
        }
      >
        <form id="edit-project-form" onSubmit={saveProject} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              required
              minLength={2}
              maxLength={100}
              value={projectForm.name}
              onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              maxLength={1000}
              value={projectForm.description}
              onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
              className="input"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
