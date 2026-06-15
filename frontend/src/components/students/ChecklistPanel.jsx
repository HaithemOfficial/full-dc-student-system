import { useState } from 'react';
import { CheckSquare, Square, Loader, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { CHECKLIST_TYPES } from '../../utils/helpers';

export default function ChecklistPanel({ student, currentStage, onUpdate, onAllMandatoryComplete }) {
  const [toggling, setToggling] = useState(null);

  if (!currentStage?.checklist?.length) return null;

  const getCompletion = (itemId) =>
    student.checklistCompletions?.find(c => String(c.itemId) === String(itemId));

  const mandatory = currentStage.checklist.filter(i => i.isMandatory);
  const optional  = currentStage.checklist.filter(i => !i.isMandatory);

  const handleToggle = async (itemId) => {
    setToggling(itemId);
    const comp = getCompletion(itemId);
    const wasChecked = comp?.completed;
    const item = currentStage.checklist.find(i => String(i._id) === itemId);
    try {
      await api.post(`/students/${student._id}/checklist/${itemId}/toggle`);

      if (!wasChecked && item?.isMandatory && onAllMandatoryComplete && mandatory.length > 0) {
        const willBeComplete = mandatory.every(m => {
          if (String(m._id) === itemId) return true;
          return getCompletion(m._id)?.completed;
        });
        if (willBeComplete) {
          await onAllMandatoryComplete();
          return;
        }
      }

      onUpdate();
    } catch {
      toast.error('Failed to update checklist item');
    } finally {
      setToggling(null);
    }
  };

  const renderItem = (item, isMandatory) => {
    const comp = getCompletion(item._id);
    const isChecked = comp?.completed;
    const isLoading = toggling === String(item._id);
    const typeInfo = CHECKLIST_TYPES[item.type] || CHECKLIST_TYPES.action;

    return (
      <div
        key={item._id}
        onClick={() => !isLoading && handleToggle(String(item._id))}
        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${
          isMandatory
            ? isChecked ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 hover:border-brand-200 hover:bg-brand-50'
            : isChecked ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-dashed border-gray-200 hover:bg-gray-50 opacity-80'
        }`}
      >
        <div className={`mt-0.5 shrink-0 ${isChecked ? (isMandatory ? 'text-green-500' : 'text-gray-400') : 'text-gray-300'}`}>
          {isLoading
            ? <Loader className="w-4 h-4 animate-spin text-brand-400" />
            : isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.label}
          </p>
          {item.notes && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.notes}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`badge ${typeInfo.color} text-xs`}>{typeInfo.label}</span>
            {item.studentFacing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">
                <Eye className="w-2.5 h-2.5" />
                {item.studentLabel ? `"${item.studentLabel}"` : 'Student sees this'}
              </span>
            )}
            {comp?.completedByName && (
              <span className="text-xs text-gray-400">by {comp.completedByName}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {mandatory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Required to Advance</p>
          {mandatory.map(item => renderItem(item, true))}
        </div>
      )}
      {optional.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Optional</p>
          {optional.map(item => renderItem(item, false))}
        </div>
      )}
    </div>
  );
}
