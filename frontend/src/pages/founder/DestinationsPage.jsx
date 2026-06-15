import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ChevronUp, Globe, Layers, FileText, Building2, Mic, ToggleLeft, ToggleRight, Lock, Video, Image as ImageIcon, Link as LinkIcon, GraduationCap, ClipboardCheck, X, BookOpen, ExternalLink, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import OnboardingSlidesTab from '../../components/onboarding/OnboardingSlidesTab';
import UsefulLinksTab from '../../components/links/UsefulLinksTab';

// ---- Small helper modals ----

function InlineForm({ label, placeholder, onSave, onCancel, initialValue = '', selectOptions }) {
  const [val, setVal] = useState(initialValue);
  return (
    <form onSubmit={e => { e.preventDefault(); if (val.trim()) onSave(val); }} className="flex gap-2 mt-2">
      {selectOptions ? (
        <select className="input flex-1 text-sm" value={val} onChange={e => setVal(e.target.value)}>
          {selectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input className="input flex-1 text-sm" value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} autoFocus />
      )}
      <button type="submit" className="btn-primary text-xs px-3 py-1.5">Save</button>
      <button type="button" onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
    </form>
  );
}

// ---- Stage Meta Editor (all student-facing fields) ----
function StageMetaEditor({ destId, stage, onUpdate }) {
  const [form, setForm] = useState({
    description: stage.description || '',
    estimatedDays: stage.estimatedDays ?? '',
    category: stage.category || 'uni_acceptance',
    alwaysOpen: stage.alwaysOpen || false,
    studentDescription: stage.studentDescription || '',
    studentWaitingFor: stage.studentWaitingFor || '',
    studentActionRequired: stage.studentActionRequired || '',
    studentTips: stage.studentTips || [],
  });
  const [saving, setSaving] = useState(false);
  const [newTip, setNewTip] = useState('');

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const addTip = () => {
    if (!newTip.trim()) return;
    setForm(p => ({ ...p, studentTips: [...p.studentTips, newTip.trim()] }));
    setNewTip('');
  };
  const removeTip = (i) => setForm(p => ({ ...p, studentTips: p.studentTips.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/destinations/${destId}/stages/${stage._id}`, {
        ...form,
        estimatedDays: form.estimatedDays === '' ? null : Number(form.estimatedDays),
      });
      onUpdate();
      toast.success('Stage updated');
    } catch {
      toast.error('Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Basic */}
      <div className="flex gap-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-1">Internal description</p>
          <input className="input text-xs" value={form.description} onChange={set('description')} placeholder="What happens during this stage (internal)..." />
        </div>
        <div className="w-28">
          <p className="text-xs font-medium text-gray-500 mb-1">Est. days</p>
          <input className="input text-xs" type="number" min="1" value={form.estimatedDays} onChange={set('estimatedDays')} placeholder="e.g. 14" />
        </div>
        <div className="w-36">
          <p className="text-xs font-medium text-gray-500 mb-1">Phase</p>
          <select className="input text-xs" value={form.category} onChange={set('category')}>
            <option value="uni_acceptance">Uni Acceptance</option>
            <option value="visa">Visa Process</option>
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs font-medium text-gray-500 mb-1">Always open</p>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, alwaysOpen: !p.alwaysOpen }))}
            className={`h-[34px] flex items-center gap-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
              form.alwaysOpen
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-gray-200 bg-white text-gray-400'
            }`}
          >
            {form.alwaysOpen
              ? <ToggleRight className="w-4 h-4" />
              : <ToggleLeft className="w-4 h-4" />
            }
            {form.alwaysOpen ? 'Yes' : 'No'}
          </button>
        </div>
      </div>

      {/* Student-facing fields */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">Student-facing content</p>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">What we are doing <span className="text-gray-300">(shown to student)</span></p>
          <textarea className="input text-xs resize-none" rows={2} value={form.studentDescription} onChange={set('studentDescription')} placeholder="e.g. We are submitting your application to the university..." />
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Currently waiting for</p>
          <input className="input text-xs" value={form.studentWaitingFor} onChange={set('studentWaitingFor')} placeholder="e.g. Waiting for university admission decision..." />
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Action required from student</p>
          <input className="input text-xs" value={form.studentActionRequired} onChange={set('studentActionRequired')} placeholder="e.g. Prepare for your motivational interview..." />
        </div>

        {/* Student tips */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Student tips</p>
          <div className="space-y-1 mb-1.5">
            {form.studentTips.map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-yellow-50 border border-yellow-100 rounded px-2 py-1">
                <span className="flex-1 text-gray-700">💡 {tip}</span>
                <button onClick={() => removeTip(i)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input className="input text-xs flex-1 py-1" value={newTip} onChange={e => setNewTip(e.target.value)} placeholder="Add tip..." onKeyDown={e => { if (e.key === 'Enter') addTip(); }} />
            <button onClick={addTip} className="btn-secondary text-xs px-2 py-1"><Plus className="w-3 h-3" /></button>
          </div>
        </div>

      </div>

      <button onClick={save} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
        {saving ? 'Saving...' : 'Save stage'}
      </button>
    </div>
  );
}

// ---- Checklist Item Manager ----
function ChecklistManager({ destId, stageId, checklist, onUpdate }) {
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', type: 'action', isMandatory: true, studentFacing: false, studentLabel: '' });
  const [editingId, setEditingId]           = useState(null);
  const [editStudentLabel, setEditStudentLabel] = useState('');
  const [editingNoteId, setEditingNoteId]   = useState(null);
  const [noteVal, setNoteVal]               = useState('');

  const addItem = async () => {
    if (!newItem.label.trim()) return;
    await api.post(`/destinations/${destId}/stages/${stageId}/checklist`, newItem);
    setAddingItem(false);
    setNewItem({ label: '', type: 'action', isMandatory: true, studentFacing: false, studentLabel: '' });
    onUpdate();
  };

  const deleteItem = async (itemId) => {
    await api.delete(`/destinations/${destId}/stages/${stageId}/checklist/${itemId}`);
    onUpdate();
  };

  const toggleMandatory = async (item) => {
    await api.put(`/destinations/${destId}/stages/${stageId}/checklist/${item._id}`, { isMandatory: !item.isMandatory });
    onUpdate();
  };

  const toggleStudentFacing = async (item) => {
    await api.put(`/destinations/${destId}/stages/${stageId}/checklist/${item._id}`, { studentFacing: !item.studentFacing });
    onUpdate();
  };

  const saveStudentLabel = async (item) => {
    await api.put(`/destinations/${destId}/stages/${stageId}/checklist/${item._id}`, { studentLabel: editStudentLabel });
    setEditingId(null);
    onUpdate();
  };

  const saveNote = async (item) => {
    await api.put(`/destinations/${destId}/stages/${stageId}/checklist/${item._id}`, { notes: noteVal });
    setEditingNoteId(null);
    onUpdate();
  };

  return (
    <div className="pl-4 space-y-2">
      {checklist?.map(item => (
        <div key={item._id} className="space-y-1 group">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.isMandatory ? 'bg-red-400' : 'bg-gray-300'}`} />
            <span className="flex-1">{item.label}</span>
            <span className={`badge text-xs ${item.type === 'action' ? 'bg-blue-50 text-blue-600' : item.type === 'verification' ? 'bg-yellow-50 text-yellow-600' : 'bg-purple-50 text-purple-600'}`}>
              {item.type.replace('_', ' ')}
            </span>
            <button
              onClick={() => toggleStudentFacing(item)}
              title={item.studentFacing ? 'Hide from students' : 'Show to students'}
              className={`text-xs px-1.5 py-0.5 rounded font-medium transition-colors ${item.studentFacing ? 'bg-green-100 text-green-700' : 'text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'}`}
            >
              {item.studentFacing ? '👤 visible' : '👁'}
            </button>
            <button onClick={() => toggleMandatory(item)} className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all text-xs">
              {item.isMandatory ? 'optional' : 'required'}
            </button>
            <button onClick={() => deleteItem(item._id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {item.studentFacing && (
            <div className="ml-4 flex items-center gap-2">
              {editingId === item._id ? (
                <>
                  <input
                    className="input text-xs flex-1 py-1"
                    value={editStudentLabel}
                    onChange={e => setEditStudentLabel(e.target.value)}
                    placeholder="Student-facing label (optional override)..."
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveStudentLabel(item); if (e.key === 'Escape') setEditingId(null); }}
                  />
                  <button onClick={() => saveStudentLabel(item)} className="btn-primary text-xs px-2 py-1">Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary text-xs px-2 py-1">Cancel</button>
                </>
              ) : (
                <button
                  onClick={() => { setEditingId(item._id); setEditStudentLabel(item.studentLabel || ''); }}
                  className="text-xs text-green-600 hover:text-green-700 italic"
                >
                  {item.studentLabel ? `"${item.studentLabel}"` : '+ add student label'}
                </button>
              )}
            </div>
          )}
          {/* Notes */}
          <div className="ml-4">
            {editingNoteId === item._id ? (
              <div className="flex items-start gap-2">
                <textarea
                  className="input text-xs flex-1 py-1 min-h-[56px] resize-none"
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                  placeholder="Internal notes for this checklist item..."
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Escape') setEditingNoteId(null); }}
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => saveNote(item)} className="btn-primary text-xs px-2 py-1">Save</button>
                  <button onClick={() => setEditingNoteId(null)} className="btn-secondary text-xs px-2 py-1">Cancel</button>
                </div>
              </div>
            ) : item.notes ? (
              <button
                onClick={() => { setEditingNoteId(item._id); setNoteVal(item.notes); }}
                className="text-xs text-gray-400 hover:text-gray-600 italic text-left leading-relaxed"
              >
                📝 {item.notes}
              </button>
            ) : (
              <button
                onClick={() => { setEditingNoteId(item._id); setNoteVal(''); }}
                className="text-xs text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                + add note
              </button>
            )}
          </div>
        </div>
      ))}
      {addingItem ? (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <input className="input text-xs" value={newItem.label} onChange={e => setNewItem(p => ({ ...p, label: e.target.value }))} placeholder="Checklist item label..." autoFocus />
          <div className="flex gap-2">
            <select className="input flex-1 text-xs" value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}>
              <option value="action">Action</option>
              <option value="verification">Verification</option>
              <option value="student_notification">Student Notification</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={newItem.isMandatory} onChange={e => setNewItem(p => ({ ...p, isMandatory: e.target.checked }))} />
              Mandatory
            </label>
            <label className="flex items-center gap-1.5 text-xs text-green-700 cursor-pointer">
              <input type="checkbox" checked={newItem.studentFacing} onChange={e => setNewItem(p => ({ ...p, studentFacing: e.target.checked }))} />
              Student visible
            </label>
          </div>
          {newItem.studentFacing && (
            <input className="input text-xs" value={newItem.studentLabel} onChange={e => setNewItem(p => ({ ...p, studentLabel: e.target.value }))} placeholder="Student-facing label override (optional)..." />
          )}
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary text-xs px-3 py-1.5">Add</button>
            <button onClick={() => setAddingItem(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingItem(true)} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-1">
          <Plus className="w-3 h-3" /> Add checklist item
        </button>
      )}
    </div>
  );
}

// ---- Stages Manager ----
const PHASE_META = {
  uni_acceptance: { label: 'University Acceptance', color: 'text-brand-600', badgeColor: 'bg-brand-100 text-brand-600' },
  visa:           { label: 'Visa Process',           color: 'text-orange-500', badgeColor: 'bg-orange-100 text-orange-600' },
};

function StagesManager({ destination, onUpdate }) {
  const [expandedStages, setExpandedStages] = useState({});
  const toggleStage = (id) => setExpandedStages(p => ({ ...p, [id]: !p[id] }));
  const [addingStage, setAddingStage] = useState(null); // null | 'uni_acceptance' | 'visa'
  const [stageName, setStageName] = useState('');
  const [reordering, setReordering] = useState(false);

  const stages = [...(destination.pipelineStages || [])].sort((a, b) => a.order - b.order);
  const uniStages = stages.filter(s => (s.category || 'uni_acceptance') === 'uni_acceptance');
  const visaStages = stages.filter(s => s.category === 'visa');

  const addStage = async (category) => {
    if (!stageName.trim()) return;
    const res = await api.post(`/destinations/${destination._id}/stages`, { name: stageName, order: 999, category });
    // Reorder to keep uni_acceptance before visa in global order
    const updated = [...(res.data.pipelineStages || [])].sort((a, b) => a.order - b.order);
    const newUni  = updated.filter(s => (s.category || 'uni_acceptance') === 'uni_acceptance');
    const newVisa = updated.filter(s => s.category === 'visa');
    await api.put(`/destinations/${destination._id}/stages/reorder`, {
      orderedIds: [...newUni, ...newVisa].map(s => String(s._id)),
    });
    setStageName('');
    setAddingStage(null);
    onUpdate();
    toast.success('Stage added');
  };

  const deleteStage = async (stageId) => {
    if (!confirm('Delete this stage?')) return;
    await api.delete(`/destinations/${destination._id}/stages/${stageId}`);
    onUpdate();
    toast.success('Stage removed');
  };

  const moveStage = async (stageId, direction) => {
    const stage = stages.find(s => String(s._id) === String(stageId));
    const cat = stage?.category || 'uni_acceptance';
    const catStages = stages.filter(s => (s.category || 'uni_acceptance') === cat);
    const idx = catStages.findIndex(s => String(s._id) === String(stageId));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= catStages.length) return;
    setReordering(true);
    const reorderedCat = [...catStages];
    [reorderedCat[idx], reorderedCat[swapIdx]] = [reorderedCat[swapIdx], reorderedCat[idx]];
    const newUni  = cat === 'uni_acceptance' ? reorderedCat : uniStages;
    const newVisa = cat === 'visa'           ? reorderedCat : visaStages;
    try {
      await api.put(`/destinations/${destination._id}/stages/reorder`, {
        orderedIds: [...newUni, ...newVisa].map(s => String(s._id)),
      });
      onUpdate();
    } catch {
      toast.error('Failed to reorder');
    } finally {
      setReordering(false);
    }
  };

  const renderPhase = (phaseKey, catStages) => {
    const meta = PHASE_META[phaseKey];
    const isVisa = phaseKey === 'visa';
    const borderCls  = isVisa ? 'border-orange-200' : 'border-brand-200';
    const headerCls  = isVisa ? 'bg-orange-50'      : 'bg-brand-50';

    return (
      <div className={`rounded-xl border-2 ${borderCls} overflow-hidden`}>
        {/* Phase header */}
        <div className={`${headerCls} px-4 py-3 flex items-center gap-2 flex-wrap`}>
          <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
          <span className="text-xs text-gray-400 font-normal">· {catStages.length} stage{catStages.length !== 1 ? 's' : ''}</span>
          {isVisa && (
            <span className={`ml-auto text-xs ${meta.color} opacity-70`}>Unlocks at first Visa stage</span>
          )}
        </div>

        {/* Stages */}
        <div className="p-3 space-y-2">
          {catStages.map((stage, catIdx) => (
            <div key={stage._id} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
              <div
                className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleStage(stage._id)}
              >
                <div className="flex flex-col shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => moveStage(stage._id, 'up')}
                    disabled={catIdx === 0 || reordering}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveStage(stage._id, 'down')}
                    disabled={catIdx === catStages.length - 1 || reordering}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${meta.badgeColor}`}>{catIdx + 1}</span>
                <span className="flex-1 font-medium text-gray-800 text-sm">{stage.name}</span>
                <span className="text-xs text-gray-400">{stage.checklist?.length || 0} items</span>
                <button onClick={e => { e.stopPropagation(); deleteStage(stage._id); }} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {expandedStages[stage._id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
              {expandedStages[stage._id] && (
                <div className="p-3 border-t border-gray-50 bg-gray-50 space-y-3">
                  <StageMetaEditor destId={destination._id} stage={stage} onUpdate={onUpdate} />
                  <p className="text-xs font-medium text-gray-500">Checklist items:</p>
                  <ChecklistManager destId={destination._id} stageId={stage._id} checklist={stage.checklist} onUpdate={onUpdate} />
                </div>
              )}
            </div>
          ))}

          {addingStage === phaseKey ? (
            <div className="flex gap-2 mt-1">
              <input
                className="input flex-1 text-sm"
                value={stageName}
                onChange={e => setStageName(e.target.value)}
                placeholder="Stage name..."
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') addStage(phaseKey);
                  if (e.key === 'Escape') { setAddingStage(null); setStageName(''); }
                }}
              />
              <button onClick={() => addStage(phaseKey)} className="btn-primary text-sm px-3">Add</button>
              <button onClick={() => { setAddingStage(null); setStageName(''); }} className="btn-secondary text-sm px-3">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => { setAddingStage(phaseKey); setStageName(''); }}
              disabled={addingStage !== null}
              className={`text-sm flex items-center gap-1.5 mt-1 disabled:opacity-40 ${isVisa ? 'text-orange-500 hover:text-orange-600' : 'text-brand-600 hover:text-brand-700'}`}
            >
              <Plus className="w-4 h-4" /> Add stage
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderPhase('uni_acceptance', uniStages)}
      {renderPhase('visa', visaStages)}
    </div>
  );
}

// ---- Document Definitions Manager (mirrors StagesManager layout) ----
const DOC_PHASE_META = {
  university_acceptance: { label: 'University Acceptance', color: 'text-brand-600', badgeColor: 'bg-brand-100 text-brand-600' },
  visa_process:          { label: 'Visa Process',          color: 'text-orange-500', badgeColor: 'bg-orange-100 text-orange-600' },
};

function DocumentDefsManager({ destination, onUpdate }) {
  const [expandedDocs, setExpandedDocs] = useState({});
  const toggleDoc = (id) => setExpandedDocs(p => ({ ...p, [id]: !p[id] }));
  const [addingDoc, setAddingDoc]       = useState(null); // null | 'university_acceptance' | 'visa_process'
  const [docName, setDocName]           = useState('');
  const [reordering, setReordering]     = useState(false);
  const [newReq, setNewReq]             = useState('');
  const [newStep, setNewStep]           = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteVal, setNoteVal]           = useState('');

  // Reset inline states when docs collapse
  useEffect(() => {
    setNewReq('');
    setNewStep('');
    setEditingNoteId(null);
    setNoteVal('');
  }, [expandedDocs]);

  const stages = [...(destination.pipelineStages || [])].sort((a, b) => a.order - b.order);
  const allDocs = [...(destination.documentDefinitions || [])].sort((a, b) => a.order - b.order);
  const uniDocs  = allDocs.filter(d => !d.phase || d.phase === 'university_acceptance');
  const visaDocs = allDocs.filter(d => d.phase === 'visa_process');

  const addDoc = async (phase) => {
    if (!docName.trim()) return;
    await api.post(`/destinations/${destination._id}/documents`, {
      name: docName,
      phase,
      order: 999,
      statusFlow: ['not_requested', 'requested', 'received', 'under_review', 'approved', 'ready'],
    });
    // Maintain phase order: uni docs first, visa docs after
    const updated = await api.get(`/destinations/${destination._id}`);
    const updatedDocs = [...(updated.data.documentDefinitions || [])].sort((a, b) => a.order - b.order);
    const newUni  = updatedDocs.filter(d => !d.phase || d.phase === 'university_acceptance');
    const newVisa = updatedDocs.filter(d => d.phase === 'visa_process');
    await api.put(`/destinations/${destination._id}/documents/reorder`, {
      orderedIds: [...newUni, ...newVisa].map(d => String(d._id)),
    });
    setDocName('');
    setAddingDoc(null);
    onUpdate();
    toast.success('Document added');
  };

  const deleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/destinations/${destination._id}/documents/${docId}`);
    onUpdate();
    toast.success('Document removed');
  };

  const moveDoc = async (docId, direction) => {
    const doc = allDocs.find(d => String(d._id) === String(docId));
    const phase = doc?.phase || 'university_acceptance';
    const phaseDocs = allDocs.filter(d => (d.phase || 'university_acceptance') === phase);
    const idx = phaseDocs.findIndex(d => String(d._id) === String(docId));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= phaseDocs.length) return;
    setReordering(true);
    const reordered = [...phaseDocs];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const newUni  = phase === 'university_acceptance' ? reordered : uniDocs;
    const newVisa = phase === 'visa_process'          ? reordered : visaDocs;
    try {
      await api.put(`/destinations/${destination._id}/documents/reorder`, {
        orderedIds: [...newUni, ...newVisa].map(d => String(d._id)),
      });
      onUpdate();
    } catch {
      toast.error('Failed to reorder');
    } finally {
      setReordering(false);
    }
  };

  const updateDocField = async (docId, fields) => {
    await api.put(`/destinations/${destination._id}/documents/${docId}`, fields);
    onUpdate();
  };

  const renderPhase = (phaseKey, phaseDocs) => {
    const meta = DOC_PHASE_META[phaseKey];
    const isVisa = phaseKey === 'visa_process';
    const borderCls = isVisa ? 'border-orange-200' : 'border-brand-200';
    const headerCls = isVisa ? 'bg-orange-50'      : 'bg-brand-50';

    return (
      <div className={`rounded-xl border-2 ${borderCls} overflow-hidden`}>
        {/* Phase header */}
        <div className={`${headerCls} px-4 py-3 flex items-center gap-2 flex-wrap`}>
          <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
          <span className="text-xs text-gray-400 font-normal">· {phaseDocs.length} document{phaseDocs.length !== 1 ? 's' : ''}</span>
          {isVisa && (
            <span className={`ml-auto text-xs ${meta.color} opacity-70`}>Unlocks at first Visa stage</span>
          )}
        </div>

        {/* Documents */}
        <div className="p-3 space-y-2">
        {phaseDocs.map((doc, phaseIdx) => (
          <div key={doc._id} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
            <div
              className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleDoc(doc._id)}
            >
              {/* Up/Down */}
              <div className="flex flex-col shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => moveDoc(doc._id, 'up')}
                  disabled={phaseIdx === 0 || reordering}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveDoc(doc._id, 'down')}
                  disabled={phaseIdx === phaseDocs.length - 1 || reordering}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Number badge */}
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${meta.badgeColor}`}>
                {phaseIdx + 1}
              </span>
              <span className="flex-1 font-medium text-gray-800 text-sm">{doc.name}</span>
              {doc.isRequired && <span className="badge bg-red-50 text-red-500 text-xs shrink-0">Required</span>}
              <button
                onClick={e => { e.stopPropagation(); deleteDoc(doc._id); }}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {expandedDocs[doc._id]
                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                : <ChevronRight className="w-4 h-4 text-gray-400" />
              }
            </div>

            {expandedDocs[doc._id] && (
              <div className="p-3 border-t border-gray-50 bg-gray-50 space-y-3">
                {/* Move to other phase */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-500">Phase:</span>
                  <button
                    onClick={() => updateDocField(doc._id, { phase: phaseKey === 'university_acceptance' ? 'visa_process' : 'university_acceptance' })}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
                  >
                    Move to {phaseKey === 'university_acceptance' ? 'Visa Process' : 'University Acceptance'}
                  </button>
                </div>
                {/* Trigger stage */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-500">Trigger stage (optional):</span>
                  <select
                    className="input text-xs py-1 w-auto"
                    value={doc.triggerStage || ''}
                    onChange={e => updateDocField(doc._id, { triggerStage: e.target.value || null })}
                  >
                    <option value="">From phase start</option>
                    {stages.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <span className="text-xs text-gray-400">
                    {doc.triggerStage
                      ? `Active from: ${stages.find(s => String(s._id) === String(doc.triggerStage))?.name || '?'}`
                      : 'Active as soon as phase unlocks'}
                  </span>
                </div>
                {/* Required toggle */}
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={doc.isRequired !== false}
                    onChange={e => updateDocField(doc._id, { isRequired: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs text-gray-600">Mark as required</span>
                </label>

                {/* Notes */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Notes</p>
                  {editingNoteId === doc._id ? (
                    <div className="space-y-1.5">
                      <textarea
                        className="input min-h-[70px] resize-none text-xs"
                        value={noteVal}
                        onChange={e => setNoteVal(e.target.value)}
                        placeholder="General explanation or context about this document…"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { updateDocField(doc._id, { notes: noteVal }); setEditingNoteId(null); }}
                          className="btn-primary text-xs px-3 py-1"
                        >Save</button>
                        <button onClick={() => setEditingNoteId(null)} className="btn-secondary text-xs px-3 py-1">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setEditingNoteId(doc._id); setNoteVal(doc.notes || ''); }}
                      className="text-xs text-gray-600 bg-white border border-gray-100 rounded-lg px-2.5 py-2 cursor-text hover:border-brand-200 transition-colors min-h-[36px]"
                    >
                      {doc.notes ? doc.notes : <span className="text-gray-300 italic">Click to add notes…</span>}
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Steps</p>
                  {(doc.steps || []).length > 0 && (
                    <ol className="space-y-1 mb-2">
                      {(doc.steps || []).map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                          <span className="text-gray-400 font-semibold shrink-0 w-4">{i + 1}.</span>
                          <span className="flex-1">{step}</span>
                          <button
                            onClick={() => updateDocField(doc._id, { steps: (doc.steps || []).filter((_, idx) => idx !== i) })}
                            className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 text-xs py-1"
                      value={newStep}
                      onChange={e => setNewStep(e.target.value)}
                      placeholder="e.g. Go to the town hall to request the document"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newStep.trim()) {
                          updateDocField(doc._id, { steps: [...(doc.steps || []), newStep.trim()] });
                          setNewStep('');
                        }
                        if (e.key === 'Escape') setNewStep('');
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!newStep.trim()) return;
                        updateDocField(doc._id, { steps: [...(doc.steps || []), newStep.trim()] });
                        setNewStep('');
                      }}
                      disabled={!newStep.trim()}
                      className="btn-secondary text-xs px-3 disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Requirements</p>
                  {(doc.requirements || []).length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {(doc.requirements || []).map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                          <span className="flex-1">{req}</span>
                          <button
                            onClick={() => updateDocField(doc._id, { requirements: (doc.requirements || []).filter((_, idx) => idx !== i) })}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 text-xs py-1"
                      value={newReq}
                      onChange={e => setNewReq(e.target.value)}
                      placeholder="e.g. Original copy required"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newReq.trim()) {
                          updateDocField(doc._id, { requirements: [...(doc.requirements || []), newReq.trim()] });
                          setNewReq('');
                        }
                        if (e.key === 'Escape') setNewReq('');
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!newReq.trim()) return;
                        updateDocField(doc._id, { requirements: [...(doc.requirements || []), newReq.trim()] });
                        setNewReq('');
                      }}
                      disabled={!newReq.trim()}
                      className="btn-secondary text-xs px-3 disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {addingDoc === phaseKey ? (
          <div className="flex gap-2 mt-1">
            <input
              className="input flex-1 text-sm"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="Document name..."
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') addDoc(phaseKey);
                if (e.key === 'Escape') { setAddingDoc(null); setDocName(''); }
              }}
            />
            <button onClick={() => addDoc(phaseKey)} className="btn-primary text-sm px-3">Add</button>
            <button onClick={() => { setAddingDoc(null); setDocName(''); }} className="btn-secondary text-sm px-3">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => { setAddingDoc(phaseKey); setDocName(''); }}
            disabled={addingDoc !== null}
            className={`text-sm flex items-center gap-1.5 mt-1 disabled:opacity-40 ${isVisa ? 'text-orange-500 hover:text-orange-600' : 'text-brand-600 hover:text-brand-700'}`}
          >
            <Plus className="w-4 h-4" /> Add document
          </button>
        )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderPhase('university_acceptance', uniDocs)}
      {renderPhase('visa_process', visaDocs)}
    </div>
  );
}

// ---- Universities Tab ----
const LEVEL_COLORS = {
  bachelor: 'bg-blue-50 text-blue-600',
  master:   'bg-purple-50 text-purple-600',
  phd:      'bg-red-50 text-red-600',
  other:    'bg-gray-100 text-gray-500',
};
const EMPTY_PROG   = { name: '', level: 'bachelor', duration: '', language: 'English', tuitionFee: '' };
const EMPTY_INTAKE = { name: '', openDate: '', closeDate: '' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function UniversityModal({ university, destinationId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: university?.name || '',
    city: university?.city || '',
    website: university?.website || '',
    applicationFee: university?.applicationFee || '',
    contactPerson: university?.contactPerson || '',
    contactEmail: university?.contactEmail || '',
    isPartner: university?.isPartner || false,
    notes: university?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [f]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, destination: destinationId };
      if (university) {
        await api.put(`/universities/${university._id}`, payload);
      } else {
        await api.post('/universities', payload);
      }
      toast.success(university ? 'University updated' : 'University added');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">{university ? 'Edit University' : 'Add University'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">University Name *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">City</label><input className="input" value={form.city} onChange={set('city')} /></div>
            <div><label className="label">Application Fee (€)</label><input className="input" type="number" value={form.applicationFee} onChange={set('applicationFee')} /></div>
            <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={set('contactPerson')} /></div>
            <div><label className="label">Contact Email</label><input className="input" type="email" value={form.contactEmail} onChange={set('contactEmail')} /></div>
          </div>
          <div><label className="label">Website</label><input className="input" type="url" value={form.website} onChange={set('website')} placeholder="https://..." /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPartner} onChange={set('isPartner')} className="w-4 h-4 text-brand-600 rounded" />
            <span className="text-sm text-gray-700">Partner University</span>
          </label>
          <div><label className="label">Notes</label><textarea className="input min-h-[70px] resize-none" value={form.notes} onChange={set('notes')} /></div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UniversitiesTab({ destination }) {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null);
  const [expandedUni, setExpandedUni]   = useState(null);
  const [addingProgram, setAddingProgram]   = useState(null); // uni _id
  const [progForm, setProgForm]             = useState(EMPTY_PROG);
  const [addingIntake, setAddingIntake]     = useState(null); // uni _id
  const [intakeForm, setIntakeForm]         = useState(EMPTY_INTAKE);

  const fetchUniversities = () => {
    setLoading(true);
    api.get(`/universities?destination=${destination._id}`)
      .then(r => setUniversities(r.data))
      .catch(() => toast.error('Failed to load universities'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUniversities(); }, [destination._id]);

  const handleDelete = async (id) => {
    if (!confirm('Remove this university?')) return;
    await api.delete(`/universities/${id}`);
    toast.success('Removed');
    fetchUniversities();
  };

  const addProgram = async (uni) => {
    if (!progForm.name.trim()) return;
    const prog = { ...progForm };
    if (prog.tuitionFee !== '') prog.tuitionFee = Number(prog.tuitionFee);
    else delete prog.tuitionFee;
    const updated = [...(uni.programs || []), prog];
    try {
      await api.put(`/universities/${uni._id}`, { programs: updated });
      setAddingProgram(null);
      setProgForm(EMPTY_PROG);
      fetchUniversities();
      toast.success('Program added');
    } catch {
      toast.error('Failed to add program');
    }
  };

  const deleteProgram = async (uni, programId) => {
    const updated = (uni.programs || []).filter(p => p._id?.toString() !== programId);
    try {
      await api.put(`/universities/${uni._id}`, { programs: updated });
      fetchUniversities();
    } catch {
      toast.error('Failed to remove program');
    }
  };

  const addIntake = async (uni) => {
    if (!intakeForm.name.trim()) return;
    const updated = [...(uni.intakes || []), { ...intakeForm }];
    try {
      await api.put(`/universities/${uni._id}`, { intakes: updated });
      setAddingIntake(null);
      setIntakeForm(EMPTY_INTAKE);
      fetchUniversities();
      toast.success('Intake added');
    } catch {
      toast.error('Failed to add intake');
    }
  };

  const deleteIntake = async (uni, idx) => {
    const updated = (uni.intakes || []).filter((_, i) => i !== idx);
    try {
      await api.put(`/universities/${uni._id}`, { intakes: updated });
      fetchUniversities();
    } catch {
      toast.error('Failed to remove intake');
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{universities.length} universit{universities.length !== 1 ? 'ies' : 'y'} for {destination.flag} {destination.name}</p>
        <button onClick={() => setModal('new')} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add University
        </button>
      </div>

      {universities.length === 0 ? (
        <div className="text-center py-10">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No universities added yet for this destination</p>
        </div>
      ) : (
        <div className="space-y-2">
          {universities.map(u => {
            const isOpen = expandedUni === u._id;
            const programs = u.programs || [];
            const intakes  = u.intakes  || [];
            return (
              <div key={u._id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* University row */}
                <div className="flex items-center gap-3 p-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                      {u.isPartner && <span className="badge bg-brand-100 text-brand-700 text-xs">Partner</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {u.city && <span className="text-xs text-gray-400">{u.city}</span>}
                      {u.applicationFee > 0 && <span className="text-xs text-gray-400">App fee: €{u.applicationFee}</span>}
                      {u.website && (
                        <a href={u.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline flex items-center gap-0.5">
                          website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Programs + Intakes toggle */}
                  <button
                    onClick={() => setExpandedUni(isOpen ? null : u._id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    {programs.length} prog
                    <span className="text-gray-200 mx-0.5">·</span>
                    <Calendar className="w-3.5 h-3.5" />
                    {intakes.length} intake{intakes.length !== 1 ? 's' : ''}
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  <button onClick={() => setModal(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(u._id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Programs section */}
                {isOpen && (
                  <div className="border-t border-gray-50 bg-gray-50 p-3 space-y-2">
                    {programs.length === 0 && addingProgram !== u._id && (
                      <p className="text-xs text-gray-400 text-center py-2">No programs yet.</p>
                    )}

                    {programs.map(p => (
                      <div key={p._id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs group">
                        <span className="flex-1 font-medium text-gray-800">{p.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${LEVEL_COLORS[p.level] || LEVEL_COLORS.other}`}>
                          {p.level}
                        </span>
                        {p.duration && <span className="text-gray-400 hidden sm:block">{p.duration}</span>}
                        {p.language && p.language !== 'English' && <span className="text-gray-400 hidden sm:block">{p.language}</span>}
                        {p.tuitionFee != null && p.tuitionFee !== '' && <span className="text-gray-400 hidden sm:block">€{Number(p.tuitionFee).toLocaleString()}/yr</span>}
                        <button
                          onClick={() => deleteProgram(u, p._id?.toString())}
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Programs label */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Programs</p>

                    {addingProgram === u._id ? (
                      <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-2">
                        <div className="flex gap-2">
                          <input
                            className="input flex-1 text-xs py-1.5"
                            value={progForm.name}
                            onChange={e => setProgForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="Program name *"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') addProgram(u); if (e.key === 'Escape') { setAddingProgram(null); setProgForm(EMPTY_PROG); } }}
                          />
                          <select
                            className="input text-xs py-1.5 w-32"
                            value={progForm.level}
                            onChange={e => setProgForm(p => ({ ...p, level: e.target.value }))}
                          >
                            <option value="bachelor">Bachelor</option>
                            <option value="master">Master</option>
                            <option value="phd">PhD</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="input flex-1 text-xs py-1.5"
                            value={progForm.duration}
                            onChange={e => setProgForm(p => ({ ...p, duration: e.target.value }))}
                            placeholder="Duration (e.g. 3 years)"
                          />
                          <input
                            className="input flex-1 text-xs py-1.5"
                            value={progForm.language}
                            onChange={e => setProgForm(p => ({ ...p, language: e.target.value }))}
                            placeholder="Language"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="input flex-1 text-xs py-1.5"
                            type="number"
                            min="0"
                            value={progForm.tuitionFee}
                            onChange={e => setProgForm(p => ({ ...p, tuitionFee: e.target.value }))}
                            placeholder="Fee per year (€) — optional"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addProgram(u)} className="btn-primary text-xs px-3 py-1.5">Add</button>
                          <button onClick={() => { setAddingProgram(null); setProgForm(EMPTY_PROG); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingProgram(u._id); setProgForm(EMPTY_PROG); }}
                        className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3 h-3" /> Add program
                      </button>
                    )}

                    {/* Admission Intakes */}
                    <div className="pt-3 mt-2 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Admission Intakes</p>

                      {intakes.length === 0 && addingIntake !== u._id && (
                        <p className="text-xs text-gray-400 text-center py-1">No intakes yet.</p>
                      )}

                      {intakes.map((intake, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs group mb-1.5">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800">{intake.name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-gray-400">
                              {intake.openDate  && <span>Opens {fmtDate(intake.openDate)}</span>}
                              {intake.closeDate && <span>Closes {fmtDate(intake.closeDate)}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteIntake(u, idx)}
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 mt-0.5 shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {addingIntake === u._id ? (
                        <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-2">
                          <input
                            className="input w-full text-xs py-1.5"
                            value={intakeForm.name}
                            onChange={e => setIntakeForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Intake name (e.g. Fall 2025) *"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Escape') { setAddingIntake(null); setIntakeForm(EMPTY_INTAKE); } }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-gray-400 mb-0.5">Opens</p>
                              <input type="date" className="input w-full text-xs py-1.5" value={intakeForm.openDate} onChange={e => setIntakeForm(f => ({ ...f, openDate: e.target.value }))} />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 mb-0.5">Closes</p>
                              <input type="date" className="input w-full text-xs py-1.5" value={intakeForm.closeDate} onChange={e => setIntakeForm(f => ({ ...f, closeDate: e.target.value }))} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => addIntake(u)} className="btn-primary text-xs px-3 py-1.5">Add</button>
                            <button onClick={() => { setAddingIntake(null); setIntakeForm(EMPTY_INTAKE); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingIntake(u._id); setIntakeForm(EMPTY_INTAKE); }}
                          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-1"
                        >
                          <Plus className="w-3 h-3" /> Add intake
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <UniversityModal
          university={modal === 'new' ? null : modal}
          destinationId={destination._id}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchUniversities(); }}
        />
      )}
    </div>
  );
}

// ---- Interview Questions Tab ----
const BLANK_TOPIC = { name: '', description: '', order: 0, interviewType: 'university', universityId: '', visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } };
const BLANK_Q     = { destination: '', topic: '', topicId: '', question: '', answerTip: '', order: 0, universityId: '' };
const BLANK_RES   = { interviewType: 'university', topicId: null, universityId: '', title: '', resourceType: 'video', url: '', description: '', order: 0 };

const RES_TYPE_META = {
  video: { label: 'Video', color: 'text-red-500' },
  image: { label: 'Image', color: 'text-blue-500' },
  pdf:   { label: 'PDF',   color: 'text-orange-500' },
  link:  { label: 'Link',  color: 'text-purple-500' },
};

function ResIcon({ type, className }) {
  if (type === 'video') return <Video   className={className || 'w-4 h-4 text-red-500'} />;
  if (type === 'image') return <ImageIcon className={className || 'w-4 h-4 text-blue-500'} />;
  if (type === 'pdf')   return <FileText className={className || 'w-4 h-4 text-orange-500'} />;
  return <LinkIcon className={className || 'w-4 h-4 text-purple-500'} />;
}

function UniBadge({ name }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium shrink-0">
      <GraduationCap className="w-2.5 h-2.5" />{name}
    </span>
  );
}

function IQVisibilityBadge({ rule }) {
  if (!rule || rule.ruleType === 'always') return null;
  const labels = { from_stage: 'From stage', until_stage: 'Until stage', between_stages: 'Between stages' };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-100 shrink-0">
      <Lock className="w-2.5 h-2.5" />{labels[rule.ruleType]}
    </span>
  );
}

function InterviewQuestionsTab({ destination }) {
  const destId     = destination._id;
  const stageNames = (destination.pipelineStages || []).map(s => s.name).filter(Boolean);

  // Interview type config (saved to destination)
  const [interviewUni, setInterviewUni]   = useState(!!destination.interviewUniversity);
  const [interviewVisa, setInterviewVisa] = useState(!!destination.interviewVisa);

  // Data
  const [topics, setTopics]       = useState([]);
  const [questions, setQuestions] = useState([]);
  const [resources, setResources] = useState([]);
  const [unis, setUnis]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState({});

  // Topic modal
  const [topicModal, setTopicModal]   = useState(false);
  const [editTopic, setEditTopic]     = useState(null);
  const [topicForm, setTopicForm]     = useState(BLANK_TOPIC);
  const [savingTopic, setSavingTopic] = useState(false);

  // Question modal
  const [qModal, setQModal]       = useState(false);
  const [editQ, setEditQ]         = useState(null);
  const [qForm, setQForm]         = useState(BLANK_Q);
  const [qSection, setQSection]   = useState('university');
  const [savingQ, setSavingQ]     = useState(false);

  // Resource modal
  const [resModal, setResModal]   = useState(false);
  const [editRes, setEditRes]     = useState(null);
  const [resForm, setResForm]     = useState(BLANK_RES);
  const [savingRes, setSavingRes] = useState(false);

  const reload = async () => {
    const [t, q, r, u] = await Promise.all([
      api.get(`/interview-topics?destination=${destId}`),
      api.get(`/interview-questions?destination=${destId}`),
      api.get(`/interview-resources?destination=${destId}`),
      api.get(`/universities?destination=${destId}`),
    ]);
    setTopics(t.data || []);
    // handle both flat array (new) and grouped object (legacy)
    setQuestions(Array.isArray(q.data) ? q.data : Object.values(q.data || {}).flat());
    setResources(r.data || []);
    setUnis(u.data || []);
  };

  useEffect(() => {
    setLoading(true);
    reload().catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [destId]);

  // ── Config toggles ──
  const toggleConfig = async (field, val) => {
    const setter = field === 'interviewUniversity' ? setInterviewUni : setInterviewVisa;
    setter(val);
    try {
      await api.put(`/destinations/${destId}`, { [field]: val });
    } catch { setter(!val); toast.error('Failed to save'); }
  };

  // ── Topic CRUD ──
  const openNewTopic = (interviewType) => { setEditTopic(null); setTopicForm({ ...BLANK_TOPIC, interviewType }); setTopicModal(true); };
  const openEditTopic = (t) => {
    setEditTopic(t);
    setTopicForm({ name: t.name, description: t.description || '', order: t.order || 0, interviewType: t.interviewType || 'university', universityId: t.universityId?.toString() || '', visibilityRule: t.visibilityRule || BLANK_TOPIC.visibilityRule });
    setTopicModal(true);
  };
  const saveTopic = async () => {
    if (!topicForm.name.trim()) return toast.error('Topic name required');
    setSavingTopic(true);
    try {
      const payload = { ...topicForm, destination: destId, universityId: topicForm.universityId || null };
      editTopic ? await api.put(`/interview-topics/${editTopic._id}`, payload) : await api.post('/interview-topics', payload);
      toast.success(editTopic ? 'Updated' : 'Created');
      setTopicModal(false);
      await reload();
    } catch { toast.error('Failed to save'); } finally { setSavingTopic(false); }
  };
  const deleteTopic = async (id) => {
    if (!confirm('Delete this topic and unlink its questions?')) return;
    await api.delete(`/interview-topics/${id}`);
    toast.success('Deleted');
    await reload();
  };
  const toggleTopicActive = async (t) => { await api.put(`/interview-topics/${t._id}`, { active: !t.active }); await reload(); };

  // ── Question CRUD ──
  const openNewQ = (interviewType, topicId = '', topicName = '') => {
    setEditQ(null); setQSection(interviewType);
    setQForm({ ...BLANK_Q, destination: destId, topicId, topic: topicName });
    setQModal(true);
  };
  const openEditQ = (q, interviewType) => {
    setEditQ(q); setQSection(interviewType);
    setQForm({ destination: destId, topic: q.topic || '', topicId: q.topicId?.toString() || '', question: q.question, answerTip: q.answerTip || '', order: q.order || 0, universityId: q.universityId?.toString() || '' });
    setQModal(true);
  };
  const saveQ = async () => {
    if (!qForm.question.trim()) return toast.error('Question required');
    if (!qForm.topicId) return toast.error('Select a topic');
    setSavingQ(true);
    try {
      const matchedTopic = topics.find(t => t._id.toString() === qForm.topicId);
      const payload = { ...qForm, topic: matchedTopic?.name || qForm.topic, universityId: qForm.universityId || null };
      editQ ? await api.put(`/interview-questions/${editQ._id}`, payload) : await api.post('/interview-questions', payload);
      toast.success(editQ ? 'Updated' : 'Added');
      setQModal(false);
      await reload();
    } catch { toast.error('Failed to save'); } finally { setSavingQ(false); }
  };
  const deleteQ = async (id) => {
    if (!confirm('Delete this question?')) return;
    await api.delete(`/interview-questions/${id}`); toast.success('Deleted'); await reload();
  };
  const toggleQActive = async (q) => { await api.put(`/interview-questions/${q._id}`, { active: !q.active }); await reload(); };

  // ── Resource CRUD ──
  const openNewRes = (interviewType, topicId = null) => {
    setEditRes(null);
    setResForm({ ...BLANK_RES, destination: destId, interviewType, topicId });
    setResModal(true);
  };
  const openEditRes = (r) => {
    setEditRes(r);
    setResForm({ destination: destId, interviewType: r.interviewType, topicId: r.topicId?.toString() || null, universityId: r.universityId?.toString() || '', title: r.title, resourceType: r.resourceType, url: r.url, description: r.description || '', order: r.order || 0 });
    setResModal(true);
  };
  const saveRes = async () => {
    if (!resForm.title.trim()) return toast.error('Title required');
    if (!resForm.url.trim()) return toast.error('URL required');
    setSavingRes(true);
    try {
      const payload = { ...resForm, universityId: resForm.universityId || null };
      editRes ? await api.put(`/interview-resources/${editRes._id}`, payload) : await api.post('/interview-resources', payload);
      toast.success(editRes ? 'Updated' : 'Added');
      setResModal(false);
      await reload();
    } catch { toast.error('Failed to save'); } finally { setSavingRes(false); }
  };
  const deleteRes = async (id) => {
    if (!confirm('Delete this resource?')) return;
    await api.delete(`/interview-resources/${id}`); toast.success('Deleted'); await reload();
  };
  const toggleResActive = async (r) => { await api.put(`/interview-resources/${r._id}`, { active: !r.active }); await reload(); };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: p[id] === false }));

  const tRule    = topicForm.visibilityRule || BLANK_TOPIC.visibilityRule;
  const setTRule = (field) => (e) => setTopicForm(p => ({ ...p, visibilityRule: { ...(p.visibilityRule || {}), [field]: e.target.value } }));

  // ── Section renderer ──
  const renderSection = (interviewType, isEnabled) => {
    const isUni         = interviewType === 'university';
    const sectionTopics = topics.filter(t => (t.interviewType || 'university') === interviewType);
    const freeResources = resources.filter(r => r.interviewType === interviewType && !r.topicId);

    return (
      <div className={`border rounded-xl overflow-hidden transition-opacity ${!isEnabled ? 'opacity-70' : ''}`}>
        {/* Section header bar */}
        <div className={`px-4 py-3 flex items-center gap-3 ${isUni ? 'bg-indigo-50 border-b border-indigo-100' : 'bg-teal-50 border-b border-teal-100'}`}>
          {isUni ? <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" /> : <ClipboardCheck className="w-4 h-4 text-teal-600 shrink-0" />}
          <span className="flex-1 font-semibold text-sm text-gray-800">
            {isUni ? 'University Interview' : 'Visa Process Interview'}
          </span>
          {!isEnabled && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Hidden from students</span>}
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => openNewTopic(interviewType)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-white/70 transition-colors">
              <Plus className="w-3 h-3" /> Topic
            </button>
            <button onClick={() => openNewQ(interviewType)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-white/70 transition-colors">
              <Plus className="w-3 h-3" /> Question
            </button>
            <button onClick={() => openNewRes(interviewType, null)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-white/70 transition-colors">
              <Plus className="w-3 h-3" /> Resource
            </button>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {sectionTopics.length === 0 && freeResources.length === 0 && (
            <p className="text-xs text-center text-gray-400 py-4">
              No topics yet.{' '}
              <button onClick={() => openNewTopic(interviewType)} className="text-brand-600 hover:underline">Add one</button>
            </p>
          )}

          {sectionTopics.map(topic => {
            const tId      = topic._id.toString();
            const isOpen   = expanded[tId] !== false;
            const topicQs  = questions.filter(q => q.topicId?.toString() === tId);
            const topicRs  = resources.filter(r => r.topicId?.toString() === tId);
            const uniName  = topic.universityId ? unis.find(u => u._id.toString() === topic.universityId.toString())?.name : null;

            return (
              <div key={tId} className={`border border-gray-100 rounded-xl overflow-hidden ${!topic.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 cursor-pointer select-none" onClick={() => toggleExpand(tId)}>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  <span className="flex-1 font-medium text-sm text-gray-800">{topic.name}</span>
                  <UniBadge name={uniName} />
                  <IQVisibilityBadge rule={topic.visibilityRule} />
                  <span className="text-[10px] text-gray-400 font-medium">{topicQs.length}Q · {topicRs.length}R</span>
                  <div className="flex items-center gap-0.5 ml-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleTopicActive(topic)} className="p-1 text-gray-400 hover:text-brand-600">
                      {topic.active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEditTopic(topic)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteTopic(tId)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-50">
                    {/* Questions */}
                    <div className="px-4 py-2 space-y-1">
                      {topicQs.length === 0 && <p className="text-xs text-gray-400 text-center py-1">No questions yet</p>}
                      {topicQs.map(q => {
                        const qUni = q.universityId ? unis.find(u => u._id.toString() === q.universityId.toString())?.name : null;
                        return (
                          <div key={q._id} className={`flex items-start gap-2 py-1.5 ${!q.active ? 'opacity-50' : ''}`}>
                            <span className="text-[10px] text-gray-300 mt-1 font-mono shrink-0">Q</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800">{q.question}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {q.answerTip && <span className="text-xs text-gray-400">💡 {q.answerTip}</span>}
                                <UniBadge name={qUni} />
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button onClick={() => toggleQActive(q)} className="p-1 text-gray-400 hover:text-brand-600">
                                {q.active ? <ToggleRight className="w-3.5 h-3.5 text-brand-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => openEditQ(q, interviewType)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil className="w-3 h-3" /></button>
                              <button onClick={() => deleteQ(q._id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={() => openNewQ(interviewType, tId, topic.name)} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-1 py-0.5">
                        <Plus className="w-3 h-3" /> Add question
                      </button>
                    </div>

                    {/* Resources for this topic */}
                    {topicRs.length > 0 && (
                      <div className="border-t border-gray-50 px-4 py-2 space-y-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Resources</p>
                        {topicRs.map(r => {
                          const rUni = r.universityId ? unis.find(u => u._id.toString() === r.universityId.toString())?.name : null;
                          return (
                            <div key={r._id} className={`flex items-center gap-2 py-1 ${!r.active ? 'opacity-50' : ''}`}>
                              <ResIcon type={r.resourceType} className="w-3.5 h-3.5 shrink-0" />
                              <span className="flex-1 text-sm text-gray-700 min-w-0 truncate">{r.title}</span>
                              {r.description && <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[100px]">{r.description}</span>}
                              <UniBadge name={rUni} />
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button onClick={() => toggleResActive(r)} className="p-1 text-gray-400 hover:text-brand-600">
                                  {r.active ? <ToggleRight className="w-3.5 h-3.5 text-brand-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => openEditRes(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => deleteRes(r._id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="px-4 pb-2">
                      <button onClick={() => openNewRes(interviewType, tId)} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add resource to this topic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Section-level free resources (no specific topic) */}
          {freeResources.length > 0 && (
            <div className="border border-dashed border-gray-200 rounded-xl px-3 py-2 space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Section resources</p>
              {freeResources.map(r => {
                const rUni = r.universityId ? unis.find(u => u._id.toString() === r.universityId.toString())?.name : null;
                return (
                  <div key={r._id} className={`flex items-center gap-2 py-1 ${!r.active ? 'opacity-50' : ''}`}>
                    <ResIcon type={r.resourceType} className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 min-w-0 truncate">{r.title}</span>
                    <UniBadge name={rUni} />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => toggleResActive(r)} className="p-1 text-gray-400 hover:text-brand-600">
                        {r.active ? <ToggleRight className="w-3.5 h-3.5 text-brand-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => openEditRes(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => deleteRes(r._id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Interview type config */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { field: 'interviewUniversity', label: 'University Interview', val: interviewUni, isUni: true },
          { field: 'interviewVisa',       label: 'Visa Interview',       val: interviewVisa, isUni: false },
        ].map(({ field, label, val, isUni }) => (
          <button
            key={field}
            onClick={() => toggleConfig(field, !val)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-start transition-all ${
              val
                ? (isUni ? 'border-indigo-200 bg-indigo-50' : 'border-teal-200 bg-teal-50')
                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
            }`}
          >
            {isUni
              ? <GraduationCap className={`w-5 h-5 shrink-0 ${val ? 'text-indigo-600' : 'text-gray-400'}`} />
              : <ClipboardCheck className={`w-5 h-5 shrink-0 ${val ? 'text-teal-600' : 'text-gray-400'}`} />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${val ? (isUni ? 'text-indigo-800' : 'text-teal-800') : 'text-gray-500'}`}>{label}</p>
              <p className={`text-xs ${val ? (isUni ? 'text-indigo-500' : 'text-teal-500') : 'text-gray-400'}`}>
                {val ? 'Required for students' : 'Not required'}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${val ? (isUni ? 'bg-indigo-600 border-indigo-600' : 'bg-teal-600 border-teal-600') : 'border-gray-300'}`}>
              {val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      {/* Sections */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {renderSection('university', interviewUni)}
          {renderSection('visa', interviewVisa)}
        </div>
      )}

      {/* ── Topic Modal ── */}
      {topicModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900">{editTopic ? 'Edit Topic' : 'Add Topic'}</h3>
            <div>
              <label className="label">Topic name *</label>
              <input className="input" value={topicForm.name} onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Study Plans, Financial Proof..." autoFocus />
            </div>
            <div>
              <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" value={topicForm.description} onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
            </div>
            <div>
              <label className="label">Interview type</label>
              <div className="flex gap-2">
                {[['university', 'University Interview'], ['visa', 'Visa Interview']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setTopicForm(p => ({ ...p, interviewType: v }))}
                    className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${topicForm.interviewType === v ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {unis.length > 0 && (
              <div>
                <label className="label">Specific to university <span className="text-gray-400 font-normal">(optional — leave blank for all)</span></label>
                <select className="input" value={topicForm.universityId || ''} onChange={e => setTopicForm(p => ({ ...p, universityId: e.target.value }))}>
                  <option value="">All universities</option>
                  {unis.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-700">Visibility rule (student stage gate)</p>
              <select className="input text-sm" value={tRule.ruleType || 'always'} onChange={setTRule('ruleType')}>
                <option value="always">Always visible</option>
                <option value="from_stage">From a stage onwards</option>
                <option value="until_stage">Until a stage (then hidden)</option>
                <option value="between_stages">Between two stages</option>
              </select>
              {(tRule.ruleType === 'from_stage' || tRule.ruleType === 'between_stages') && (
                stageNames.length > 0
                  ? <select className="input text-sm" value={tRule.fromStage || ''} onChange={setTRule('fromStage')}><option value="">From stage...</option>{stageNames.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  : <input className="input text-sm" value={tRule.fromStage || ''} onChange={setTRule('fromStage')} placeholder="Stage name..." />
              )}
              {(tRule.ruleType === 'until_stage' || tRule.ruleType === 'between_stages') && (
                stageNames.length > 0
                  ? <select className="input text-sm" value={tRule.toStage || ''} onChange={setTRule('toStage')}><option value="">Until stage...</option>{stageNames.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  : <input className="input text-sm" value={tRule.toStage || ''} onChange={setTRule('toStage')} placeholder="Stage name..." />
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={saveTopic} disabled={savingTopic} className="btn-primary flex-1">{savingTopic ? 'Saving...' : editTopic ? 'Save Changes' : 'Add Topic'}</button>
              <button onClick={() => setTopicModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question Modal ── */}
      {qModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{editQ ? 'Edit Question' : 'Add Question'}</h3>
            <div>
              <label className="label">Topic *</label>
              <select className="input" value={qForm.topicId || ''} onChange={e => { const t = topics.find(t => t._id.toString() === e.target.value); setQForm(p => ({ ...p, topicId: e.target.value, topic: t?.name || '' })); }}>
                <option value="">Select topic...</option>
                {topics.filter(t => (t.interviewType || 'university') === qSection).map(t => <option key={t._id} value={t._id.toString()}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Question *</label>
              <textarea className="input min-h-[80px] resize-none" value={qForm.question} onChange={e => setQForm(p => ({ ...p, question: e.target.value }))} autoFocus placeholder="e.g. Why did you choose this country?" />
            </div>
            <div>
              <label className="label">Answer tip <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea className="input min-h-[60px] resize-none" value={qForm.answerTip} onChange={e => setQForm(p => ({ ...p, answerTip: e.target.value }))} placeholder="Hint shown to student..." />
            </div>
            {unis.length > 0 && (
              <div>
                <label className="label">Specific to university <span className="text-gray-400 font-normal">(optional)</span></label>
                <select className="input" value={qForm.universityId || ''} onChange={e => setQForm(p => ({ ...p, universityId: e.target.value }))}>
                  <option value="">All universities</option>
                  {unis.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={saveQ} disabled={savingQ} className="btn-primary flex-1">{savingQ ? 'Saving...' : editQ ? 'Save Changes' : 'Add Question'}</button>
              <button onClick={() => setQModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resource Modal ── */}
      {resModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900">{editRes ? 'Edit Resource' : 'Add Resource'}</h3>
            <div>
              <label className="label">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(RES_TYPE_META).map(([v, { label, color }]) => (
                  <button key={v} type="button" onClick={() => setResForm(p => ({ ...p, resourceType: v }))}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs transition-colors ${resForm.resourceType === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <ResIcon type={v} className={`w-4 h-4 ${resForm.resourceType === v ? 'text-brand-600' : color}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Title *</label>
              <input className="input" value={resForm.title} onChange={e => setResForm(p => ({ ...p, title: e.target.value }))} autoFocus placeholder="e.g. Embassy Interview Guide" />
            </div>
            <div>
              <label className="label">URL *</label>
              <input className="input" value={resForm.url} onChange={e => setResForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" value={resForm.description} onChange={e => setResForm(p => ({ ...p, description: e.target.value }))} placeholder="Short note..." />
            </div>
            <div>
              <label className="label">Attach to topic <span className="text-gray-400 font-normal">(optional)</span></label>
              <select className="input" value={resForm.topicId || ''} onChange={e => setResForm(p => ({ ...p, topicId: e.target.value || null }))}>
                <option value="">No specific topic (section-level)</option>
                {topics.filter(t => (t.interviewType || 'university') === resForm.interviewType).map(t => <option key={t._id} value={t._id.toString()}>{t.name}</option>)}
              </select>
            </div>
            {unis.length > 0 && (
              <div>
                <label className="label">Specific to university <span className="text-gray-400 font-normal">(optional)</span></label>
                <select className="input" value={resForm.universityId || ''} onChange={e => setResForm(p => ({ ...p, universityId: e.target.value }))}>
                  <option value="">All universities</option>
                  {unis.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Interview section</label>
              <div className="flex gap-2">
                {[['university', 'University Interview'], ['visa', 'Visa Interview']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setResForm(p => ({ ...p, interviewType: v, topicId: null }))}
                    className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${resForm.interviewType === v ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={saveRes} disabled={savingRes} className="btn-primary flex-1">{savingRes ? 'Saving...' : editRes ? 'Save Changes' : 'Add Resource'}</button>
              <button onClick={() => setResModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main Destinations Page ----
export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDestId, setActiveDestId] = useState(null);
  const [activeTab, setActiveTab] = useState('stages');
  const [showNewDest, setShowNewDest] = useState(false);
  const [newDest, setNewDest] = useState({ name: '', code: '', flag: '' });

  const fetchDestinations = () =>
    api.get('/destinations').then(r => {
      setDestinations(r.data);
      if (!activeDestId && r.data.length > 0) setActiveDestId(r.data[0]._id);
      setLoading(false);
    });

  useEffect(() => { fetchDestinations(); }, []);

  const activeDest = destinations.find(d => d._id === activeDestId);

  const createDestination = async (e) => {
    e.preventDefault();
    await api.post('/destinations', newDest);
    toast.success('Destination created');
    setShowNewDest(false);
    setNewDest({ name: '', code: '', flag: '' });
    fetchDestinations();
  };

  const toggleActive = async (dest) => {
    await api.put(`/destinations/${dest._id}`, { isActive: !dest.isActive });
    fetchDestinations();
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Destinations</h2>
          <p className="text-sm text-gray-400 mt-0.5">Configure pipeline stages, checklists, and documents per destination</p>
        </div>
        <button onClick={() => setShowNewDest(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Destination
        </button>
      </div>

      {showNewDest && (
        <form onSubmit={createDestination} className="card p-5 space-y-4 border-brand-100 bg-brand-50">
          <h3 className="font-semibold text-brand-700 text-sm">New Destination</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Name *</label><input className="input" value={newDest.name} onChange={e => setNewDest(p => ({ ...p, name: e.target.value }))} required placeholder="Lithuania" /></div>
            <div><label className="label">Code *</label><input className="input" value={newDest.code} onChange={e => setNewDest(p => ({ ...p, code: e.target.value.toUpperCase() }))} required placeholder="LT" maxLength={3} /></div>
            <div><label className="label">Flag emoji</label><input className="input" value={newDest.flag} onChange={e => setNewDest(p => ({ ...p, flag: e.target.value }))} placeholder="🇱🇹" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Create</button>
            <button type="button" onClick={() => setShowNewDest(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Destinations list */}
        <div className="flex flex-row flex-wrap lg:flex-col lg:w-48 lg:shrink-0 gap-1">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
            </div>
          ) : destinations.map(d => (
            <button
              key={d._id}
              onClick={() => setActiveDestId(d._id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                d._id === activeDestId ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              } ${!d.isActive ? 'opacity-50' : ''}`}
            >
              <span className="text-base">{d.flag || '🌍'}</span>
              <span className="flex-1">{d.name}</span>
              {!d.isActive && <span className="text-xs opacity-70">Off</span>}
            </button>
          ))}
        </div>

        {/* Destination config */}
        {activeDest ? (
          <div className="flex-1 min-w-0 space-y-4">
            <div className="card p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">{activeDest.flag || '🌍'}</span>
                  {activeDest.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Code: {activeDest.code}</p>
              </div>
              <button onClick={() => toggleActive(activeDest)} className="btn-secondary text-xs px-3 py-1.5">
                {activeDest.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
              {[
                { id: 'stages',      label: 'Pipeline',      icon: Layers },
                { id: 'documents',   label: 'Documents',     icon: FileText },
                { id: 'universities',label: 'Universities',  icon: Building2 },
                { id: 'interview',   label: 'Interview',     icon: Mic },
                { id: 'slides',      label: 'Onboarding',    icon: BookOpen },
                { id: 'links',       label: 'Useful Links',  icon: LinkIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="card p-5">
              {activeTab === 'stages'       && <StagesManager destination={activeDest} onUpdate={fetchDestinations} />}
              {activeTab === 'documents'    && <DocumentDefsManager destination={activeDest} onUpdate={fetchDestinations} />}
              {activeTab === 'universities' && <UniversitiesTab destination={activeDest} />}
              {activeTab === 'interview'    && <InterviewQuestionsTab destination={activeDest} />}
              {activeTab === 'slides'       && <OnboardingSlidesTab destination={activeDest} allDestinations={destinations} />}
              {activeTab === 'links'        && <UsefulLinksTab destination={activeDest} allDestinations={destinations} />}
            </div>
          </div>
        ) : (
          <div className="flex-1 card p-12 text-center">
            <Globe className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Select a destination to configure it</p>
          </div>
        )}
      </div>
    </div>
  );
}
