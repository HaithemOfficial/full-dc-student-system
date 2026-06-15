import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import Pagination from '../components/Pagination';
import { useActionItems } from '../hooks/useActionItems';
import { useAuth } from '../context/AuthContext';
import { TaskItem } from '../components/tasks/TaskList';
import ActionItemForm from '../components/tasks/ActionItemForm';

const PAGE_SIZE = 15;

export default function TasksPage() {
  const { user } = useAuth();
  const { items, loading, refetch } = useActionItems({});

  const [formOpen,     setFormOpen]     = useState(false);
  const [editingItem,  setEditingItem]  = useState(null);
  const [showDone,     setShowDone]     = useState(false);
  const [page,         setPage]         = useState(1);

  const myId = String(user._id);

  const allItems = useMemo(() => {
    const now = new Date();
    return [...items].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      const aOver = a.dueDate && new Date(a.dueDate) < now && a.status !== 'done';
      const bOver = b.dueDate && new Date(b.dueDate) < now && b.status !== 'done';
      if (aOver !== bOver) return aOver ? -1 : 1;
      if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [items]);

  const pending      = allItems.filter(i => i.status === 'pending');
  const done         = allItems.filter(i => i.status === 'done');
  const overdueCount = pending.filter(i => i.dueDate && new Date(i.dueDate) < new Date()).length;
  const urgentCount  = pending.filter(i => i.priority === 'urgent').length;

  const totalPages = Math.ceil(pending.length / PAGE_SIZE);
  const paginated  = pending.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditingItem(null); setFormOpen(true); };
  const openEdit   = (item) => { setEditingItem(item); setFormOpen(true); };
  const closeForm  = () => { setFormOpen(false); setEditingItem(null); };
  const onSaved    = () => { closeForm(); refetch(); };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tasks & Reminders</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {pending.length} active
            {urgentCount  > 0 && <span className="text-red-500"> · {urgentCount} urgent</span>}
            {overdueCount > 0 && <span className="text-red-500"> · {overdueCount} overdue</span>}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Item
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : pending.length === 0 && done.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Nothing here yet — add your first item.</div>
      ) : (
        <div className="space-y-2">
          {paginated.map(item => (
            <TaskItem
              key={item._id}
              task={item}
              onUpdate={refetch}
              onEdit={openEdit}
              showAssignee={String(item.assignedTo) !== myId}
            />
          ))}

          <Pagination
            page={page}
            totalPages={totalPages}
            total={pending.length}
            pageSize={PAGE_SIZE}
            onChange={p => { setPage(p); window.scrollTo(0, 0); }}
          />

          {done.length > 0 && (
            <div className="pt-2 space-y-2">
              <button
                onClick={() => setShowDone(v => !v)}
                className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider px-1 hover:text-gray-600 transition-colors"
              >
                <span>{showDone ? '▾' : '▸'}</span>
                Completed ({done.length})
              </button>
              {showDone && done.map(item => (
                <TaskItem
                  key={item._id}
                  task={item}
                  onUpdate={refetch}
                  onEdit={openEdit}
                  showAssignee={String(item.assignedTo) !== myId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <ActionItemForm
          initial={editingItem}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
