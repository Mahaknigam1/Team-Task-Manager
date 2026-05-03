const statusMeta = {
  todo: { label: 'To do', cls: 'bg-slate-100 text-slate-700' },
  'in-progress': { label: 'In progress', cls: 'bg-amber-100 text-amber-800' },
  done: { label: 'Done', cls: 'bg-emerald-100 text-emerald-800' },
};

const priorityMeta = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TaskCard({ task, canEdit, canDelete, onStatusChange, onEdit, onDelete }) {
  const isOverdue =
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 leading-snug">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {canEdit && (
            <button onClick={onEdit} className="btn-ghost px-2 py-1 text-xs" title="Edit">
              ✏️
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              title="Delete"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`badge ${statusMeta[task.status].cls}`}>
          {statusMeta[task.status].label}
        </span>
        <span className={`badge ${priorityMeta[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span
            className={`badge ${
              isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            📅 {formatDate(task.dueDate)}
            {isOverdue && ' · overdue'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          {task.assignedTo ? (
            <span>
              <span className="text-slate-400">Assigned to</span>{' '}
              <span className="font-medium text-slate-700">{task.assignedTo.name}</span>
            </span>
          ) : (
            <span className="italic text-slate-400">Unassigned</span>
          )}
        </div>
        <select
          value={task.status}
          onChange={(e) => onStatusChange?.(e.target.value)}
          className="text-xs rounded border border-slate-300 px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
}
