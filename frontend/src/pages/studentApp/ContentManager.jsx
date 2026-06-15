import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Lock, ExternalLink, ChevronDown, ChevronUp, X, Check, Save, ArrowUp, ArrowDown, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import AnnouncementsPage from './AnnouncementsPage';

const ARTICLE_TYPE_LABELS = {
  destination_overview: { label: 'Overview',     color: 'bg-blue-100 text-blue-700' },
  university_info:      { label: 'University',   color: 'bg-indigo-100 text-indigo-700' },
  visa_checklist:       { label: 'Checklist',    color: 'bg-green-100 text-green-700' },
  after_arrival:        { label: 'After Arrival',color: 'bg-teal-100 text-teal-700' },
  student_tip:          { label: 'Tip',          color: 'bg-yellow-100 text-yellow-700' },
};

const RULE_LABELS = {
  always:         { label: 'Always',  color: 'bg-green-50 text-green-600 border-green-100' },
  from_stage:     { label: 'From',    color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  until_stage:    { label: 'Until',   color: 'bg-orange-50 text-orange-600 border-orange-100' },
  between_stages: { label: 'Between', color: 'bg-purple-50 text-purple-600 border-purple-100' },
};

function VisibilityBadge({ rule }) {
  const r = rule || { ruleType: 'always' };
  const cfg = RULE_LABELS[r.ruleType] || RULE_LABELS.always;
  const detail = r.ruleType === 'from_stage' ? r.fromStage
    : r.ruleType === 'until_stage' ? r.toStage
    : r.ruleType === 'between_stages' ? `${r.fromStage} → ${r.toStage}`
    : '';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap ${cfg.color}`}>
      {r.ruleType !== 'always' && <Lock className="w-2.5 h-2.5" />}
      {cfg.label}{detail ? `: ${detail}` : ''}
    </span>
  );
}

// Inline visibility rule editor popover
function VisibilityEditor({ rule, stageNames, onSave, onClose }) {
  const [r, setR] = useState(rule || { ruleType: 'always', fromStage: '', toStage: '' });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute z-30 top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility rule</p>
      <select className="input text-xs py-1.5" value={r.ruleType} onChange={e => setR(p => ({ ...p, ruleType: e.target.value }))}>
        <option value="always">Always visible</option>
        <option value="from_stage">From a stage</option>
        <option value="until_stage">Until a stage</option>
        <option value="between_stages">Between stages</option>
      </select>
      {(r.ruleType === 'from_stage' || r.ruleType === 'between_stages') && (
        <select className="input text-xs py-1.5" value={r.fromStage} onChange={e => setR(p => ({ ...p, fromStage: e.target.value }))}>
          <option value="">From stage...</option>
          {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {(r.ruleType === 'until_stage' || r.ruleType === 'between_stages') && (
        <select className="input text-xs py-1.5" value={r.toStage} onChange={e => setR(p => ({ ...p, toStage: e.target.value }))}>
          <option value="">Until stage...</option>
          {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(r)} className="flex-1 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1">
          <Check className="w-3 h-3" /> Save
        </button>
        <button onClick={onClose} className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">Cancel</button>
      </div>
    </div>
  );
}

// Inline article create/edit modal — stays inside ContentManager
function ArticleModal({ destId, destName, stageNames, articleType, typeCfg, onClose, onSaved, existing }) {
  const isEditing = Boolean(existing);
  const [title, setTitle]       = useState(existing?.title || '');
  const [overview, setOverview] = useState(existing?.overview || '');
  const [status, setStatus]     = useState(existing?.status || 'draft');
  const [rule, setRule]         = useState(existing?.visibilityRule || { ruleType: 'always', fromStage: '', toStage: '' });
  const [saving, setSaving]     = useState(false);

  const setRuleField = (field) => (e) => setRule(p => ({ ...p, [field]: e.target.value }));

  const save = async (publish = false) => {
    if (!title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = {
        type: 'destination',
        title,
        overview,
        status: publish ? 'published' : status,
        studentFacing: true,
        articleType,
        destinationRef: destId,
        destinationName: destName,
        visibilityRule: rule,
      };
      if (isEditing) {
        await api.patch(`/kb/${existing._id}`, payload);
        toast.success('Saved');
      } else {
        await api.post('/kb', payload);
        toast.success('Created');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg?.color || 'bg-gray-100 text-gray-600'}`}>
              {typeCfg?.label || articleType}
            </span>
            <h3 className="font-bold text-gray-900">{isEditing ? 'Edit' : 'New'} {typeCfg?.label}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Title *</label>
            <input
              className="input w-full"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Visa Application Checklist"
              autoFocus
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Content</label>
            <textarea
              className="input w-full resize-none text-sm"
              rows={6}
              value={overview}
              onChange={e => setOverview(e.target.value)}
              placeholder="Write the content students will see..."
            />
          </div>

          {/* Visibility rule */}
          <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-indigo-700">When is this visible to students?</p>
            <select className="input text-sm" value={rule.ruleType} onChange={setRuleField('ruleType')}>
              <option value="always">Always visible</option>
              <option value="from_stage">From a stage onwards</option>
              <option value="until_stage">Until a stage (then hidden)</option>
              <option value="between_stages">Between two stages</option>
            </select>
            {(rule.ruleType === 'from_stage' || rule.ruleType === 'between_stages') && (
              <select className="input text-sm" value={rule.fromStage} onChange={setRuleField('fromStage')}>
                <option value="">From stage...</option>
                {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {(rule.ruleType === 'until_stage' || rule.ruleType === 'between_stages') && (
              <select className="input text-sm" value={rule.toStage} onChange={setRuleField('toStage')}>
                <option value="">Until stage...</option>
                {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {rule.ruleType === 'always' && (
              <p className="text-xs text-indigo-500">Visible from day one, regardless of pipeline stage.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={() => save(false)} disabled={saving} className="btn-secondary text-sm flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => save(true)} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
          <button onClick={onClose} className="ml-auto text-sm text-gray-400 hover:text-gray-600">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Articles tab (Guides, Checklists, Tips)
function ArticlesTab({ destId, destName, filterFn, articleType, tabLabel, stageNames, onRefresh }) {
  const [articles, setArticles]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [editingVisibility, setEV]      = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingArticle, setEditArticle]= useState(null);

  const typeCfg = ARTICLE_TYPE_LABELS[articleType] || { label: tabLabel, color: 'bg-gray-100 text-gray-600' };

  const load = () => {
    if (!destId) return;
    setLoading(true);
    api.get(`/kb?destination=${destId}&studentFacing=true`)
      .then(r => setArticles((r.data || []).filter(filterFn)))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [destId]);

  const toggleStatus = async (article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await api.patch(`/kb/${article._id}`, { status: newStatus });
      toast.success(newStatus === 'published' ? 'Published' : 'Unpublished');
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this article?')) return;
    try { await api.delete(`/kb/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const saveVisibility = async (articleId, rule) => {
    try {
      await api.patch(`/kb/${articleId}`, { visibilityRule: rule });
      toast.success('Visibility updated');
      load();
    } catch { toast.error('Failed to update'); }
    setEV(null);
  };

  const openCreate = () => { setEditArticle(null); setModalOpen(true); };
  const openEdit   = (art) => { setEditArticle(art); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditArticle(null); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{articles.length} {tabLabel}{articles.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add {tabLabel}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : articles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No {tabLabel.toLowerCase()}s yet for this destination.</p>
          <button onClick={openCreate} className="btn-primary mt-3 text-sm inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add first
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Visibility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map(art => (
                <tr key={art._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[260px]">{art.title}</p>
                    {art.linkedStage && <p className="text-xs text-gray-400 mt-0.5">Stage: {art.linkedStage}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setEV(editingVisibility === art._id ? null : art._id)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <VisibilityBadge rule={art.visibilityRule} />
                      </button>
                      {editingVisibility === art._id && (
                        <VisibilityEditor
                          rule={art.visibilityRule}
                          stageNames={stageNames}
                          onSave={(rule) => saveVisibility(art._id, rule)}
                          onClose={() => setEV(null)}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(art)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${art.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {art.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {art.updatedAt ? new Date(art.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    {art.lastUpdatedByName && <p className="text-gray-300">{art.lastUpdatedByName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(art)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(art._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ArticleModal
          destId={destId}
          destName={destName}
          stageNames={stageNames}
          articleType={articleType}
          typeCfg={typeCfg}
          onClose={closeModal}
          onSaved={load}
          existing={editingArticle}
        />
      )}
    </div>
  );
}

// Interview Prep tab
function InterviewTab({ destId, stageNames }) {
  const [topics, setTopics]             = useState([]);
  const [expandedTopic, setExpanded]    = useState(null);
  const [loading, setLoading]           = useState(false);
  const [topicModal, setTopicModal]     = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm]       = useState({ name: '', description: '', order: 0, visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } });
  const [savingTopic, setSavingTopic]   = useState(false);
  const [editingVisibility, setEV]      = useState(null);

  const load = () => {
    if (!destId) return;
    setLoading(true);
    Promise.all([
      api.get(`/interview-topics?destination=${destId}`),
      api.get(`/interview-questions?destination=${destId}`),
    ]).then(([tRes, qRes]) => {
      const questions = qRes.data || [];
      setTopics((tRes.data || []).map(t => ({
        ...t,
        questions: questions.filter(q => String(q.topicId) === String(t._id)),
        questionCount: questions.filter(q => String(q.topicId) === String(t._id)).length,
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [destId]);

  const saveTopic = async () => {
    if (!topicForm.name.trim()) return toast.error('Topic name required');
    setSavingTopic(true);
    try {
      if (editingTopic) {
        await api.put(`/interview-topics/${editingTopic._id}`, topicForm);
        toast.success('Updated');
      } else {
        await api.post('/interview-topics', { ...topicForm, destination: destId });
        toast.success('Topic created');
      }
      setTopicModal(false);
      load();
    } catch { toast.error('Failed to save'); } finally { setSavingTopic(false); }
  };

  const removeTopic = async (id) => {
    if (!confirm('Delete topic and unlink its questions?')) return;
    try { await api.delete(`/interview-topics/${id}`); load(); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const toggleActive = async (t) => {
    try { await api.put(`/interview-topics/${t._id}`, { active: !t.active }); load(); }
    catch { toast.error('Failed'); }
  };

  const saveTopicVisibility = async (id, rule) => {
    try { await api.put(`/interview-topics/${id}`, { visibilityRule: rule }); load(); toast.success('Updated'); }
    catch { toast.error('Failed'); }
    setEV(null);
  };

  const tRule = topicForm.visibilityRule || { ruleType: 'always', fromStage: '', toStage: '' };
  const setTRule = (field) => (e) => setTopicForm(p => ({ ...p, visibilityRule: { ...(p.visibilityRule || {}), [field]: e.target.value } }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{topics.length} topic{topics.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingTopic(null); setTopicForm({ name: '', description: '', order: topics.length, visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } }); setTopicModal(true); }}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Topic
          </button>
          <Link to="/interview-questions" className="btn-secondary text-sm flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Full Manager
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : topics.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No interview topics yet for this destination.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t._id} className={`card overflow-hidden ${!t.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setExpanded(expandedTopic === t._id ? null : t._id)} className="flex-1 text-left flex items-center gap-2 min-w-0">
                  {expandedTopic === t._id ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  <span className="font-medium text-gray-900 text-sm truncate">{t.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{t.questionCount || 0} Q</span>
                  <div className="relative ml-1">
                    <button onClick={e => { e.stopPropagation(); setEV(editingVisibility === t._id ? null : t._id); }} className="hover:opacity-70">
                      <VisibilityBadge rule={t.visibilityRule} />
                    </button>
                    {editingVisibility === t._id && (
                      <VisibilityEditor rule={t.visibilityRule} stageNames={stageNames} onSave={(rule) => saveTopicVisibility(t._id, rule)} onClose={() => setEV(null)} />
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(t)} className="p-1 text-gray-400 hover:text-brand-600">
                    {t.active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingTopic(t); setTopicForm({ name: t.name, description: t.description || '', order: t.order || 0, visibilityRule: t.visibilityRule || { ruleType: 'always', fromStage: '', toStage: '' } }); setTopicModal(true); }}
                    className="p-1 text-gray-400 hover:text-brand-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeTopic(t._id)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {expandedTopic === t._id && t.questions && t.questions.length > 0 && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {t.questions.map(q => (
                    <div key={q._id} className="px-10 py-2.5 flex items-start gap-3">
                      <p className="text-sm text-gray-700 flex-1 leading-snug">{q.question}</p>
                      {q.answerTip && <span className="text-xs text-brand-400 shrink-0">💡 Has tip</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {topicModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-gray-900">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h3>
            <div>
              <label className="label">Name *</label>
              <input className="input" value={topicForm.name} onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Study Plans" autoFocus />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={topicForm.description} onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
            </div>
            <div>
              <label className="label">Order</label>
              <input className="input w-20" type="number" min="0" value={topicForm.order} onChange={e => setTopicForm(p => ({ ...p, order: Number(e.target.value) }))} />
            </div>
            <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-700">Visibility rule</p>
              <select className="input text-sm" value={tRule.ruleType} onChange={setTRule('ruleType')}>
                <option value="always">Always visible</option>
                <option value="from_stage">From a stage</option>
                <option value="until_stage">Until a stage</option>
                <option value="between_stages">Between stages</option>
              </select>
              {(tRule.ruleType === 'from_stage' || tRule.ruleType === 'between_stages') && (
                <select className="input text-sm" value={tRule.fromStage} onChange={setTRule('fromStage')}>
                  <option value="">From stage...</option>
                  {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              {(tRule.ruleType === 'until_stage' || tRule.ruleType === 'between_stages') && (
                <select className="input text-sm" value={tRule.toStage} onChange={setTRule('toStage')}>
                  <option value="">Until stage...</option>
                  {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={saveTopic} disabled={savingTopic} className="btn-primary flex-1">{savingTopic ? 'Saving...' : editingTopic ? 'Save Changes' : 'Add Topic'}</button>
              <button onClick={() => setTopicModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared VisibilityInline ──────────────────────────────────────────────────
function VisibilityInline({ rule, stageNames, onChange }) {
  const r = rule || { ruleType: 'always', fromStage: '', toStage: '' };
  const setF = (field) => (e) => onChange({ ...r, [field]: e.target.value });
  return (
    <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-indigo-700">Visibility rule</p>
      <select className="input text-sm" value={r.ruleType} onChange={setF('ruleType')}>
        <option value="always">Always visible</option>
        <option value="from_stage">From a stage onwards</option>
        <option value="until_stage">Until a stage (then hidden)</option>
        <option value="between_stages">Between two stages</option>
      </select>
      {(r.ruleType === 'from_stage' || r.ruleType === 'between_stages') && (
        <select className="input text-sm" value={r.fromStage} onChange={setF('fromStage')}>
          <option value="">From stage...</option>
          {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {(r.ruleType === 'until_stage' || r.ruleType === 'between_stages') && (
        <select className="input text-sm" value={r.toStage} onChange={setF('toStage')}>
          <option value="">Until stage...</option>
          {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
    </div>
  );
}

// ── Student Guides Tab ────────────────────────────────────────────────────────
const GUIDE_CATEGORIES = [
  { value: '',              label: '— None —' },
  { value: 'travel',        label: '✈️ Travel & Packing' },
  { value: 'arrival',       label: '🏠 After Arrival' },
  { value: 'documents',     label: '📄 Documents' },
  { value: 'accommodation', label: '🏢 Accommodation' },
  { value: 'finance',       label: '🏦 Finance' },
  { value: 'general',       label: '🔧 General' },
];

function GuideModal({ destId, destName, stageNames, onClose, onSaved, existing }) {
  const isEditing = Boolean(existing);
  const [form, setForm] = useState({
    title:         existing?.title || '',
    overview:      existing?.overview || '',
    guideCategory: existing?.guideCategory || '',
    status:        existing?.status || 'draft',
    visibilityRule: existing?.visibilityRule || { ruleType: 'always', fromStage: '', toStage: '' },
  });
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const save = async (publish = false) => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = {
        type: 'destination', studentFacing: true, articleType: 'guide',
        title: form.title, overview: form.overview, guideCategory: form.guideCategory,
        status: publish ? 'published' : form.status,
        destinationRef: destId, destinationName: destName,
        visibilityRule: form.visibilityRule,
      };
      if (isEditing) {
        await api.patch(`/kb/${existing._id}`, payload);
        toast.success('Saved');
      } else {
        await api.post('/kb', payload);
        toast.success('Guide created');
      }
      onSaved(); onClose();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">{isEditing ? 'Edit Guide' : 'New Guide'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Travel Backpack Guide" autoFocus />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.guideCategory} onChange={set('guideCategory')}>
              {GUIDE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input resize-none text-sm" rows={7} value={form.overview} onChange={set('overview')} placeholder="Write the guide content students will see..." />
          </div>
          <VisibilityInline rule={form.visibilityRule} stageNames={stageNames} onChange={(r) => setForm(p => ({ ...p, visibilityRule: r }))} />
        </div>
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={() => save(false)} disabled={saving} className="btn-secondary text-sm flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => save(true)} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
          <button onClick={onClose} className="ml-auto text-sm text-gray-400 hover:text-gray-600">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function StudentGuidesTab({ destId, destName, stageNames }) {
  const [guides, setGuides]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingGuide, setEditGuide]  = useState(null);

  const load = () => {
    if (!destId) return;
    setLoading(true);
    api.get(`/kb?destination=${destId}&studentFacing=true`)
      .then(r => setGuides((r.data || []).filter(a => a.articleType === 'guide')))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [destId]);

  const toggleStatus = async (a) => {
    const s = a.status === 'published' ? 'draft' : 'published';
    try { await api.patch(`/kb/${a._id}`, { status: s }); load(); toast.success(s === 'published' ? 'Published' : 'Unpublished'); }
    catch { toast.error('Failed'); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this guide?')) return;
    try { await api.delete(`/kb/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const catLabel = (v) => GUIDE_CATEGORIES.find(c => c.value === v)?.label || '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{guides.length} guide{guides.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { setEditGuide(null); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Guide
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : guides.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No guides yet. Add practical guides students will see in the Guides section.</p>
          <button onClick={() => { setEditGuide(null); setModalOpen(true); }} className="btn-primary mt-3 text-sm inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add first
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Visibility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {guides.map(g => (
                <tr key={g._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{g.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{catLabel(g.guideCategory)}</td>
                  <td className="px-4 py-3"><VisibilityBadge rule={g.visibilityRule} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(g)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${g.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {g.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditGuide(g); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-brand-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(g._id)} className="p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && (
        <GuideModal
          destId={destId} destName={destName} stageNames={stageNames}
          onClose={() => { setModalOpen(false); setEditGuide(null); }}
          onSaved={load} existing={editingGuide}
        />
      )}
    </div>
  );
}

// ── Interview Videos Sub-tab ──────────────────────────────────────────────────
function detectPlatform(url) {
  if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\//.test(url)) return 'youtube';
  if (/tiktok\.com\/@.+\/video\//.test(url)) return 'tiktok';
  return null;
}

function VideoModal({ destId, stageNames, onClose, onSaved, existing }) {
  const isEditing = Boolean(existing);
  const EMPTY = { title: '', description: '', url: '', order: 0, visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } };
  const [form, setForm] = useState(existing ? { title: existing.title, description: existing.description || '', url: existing.url, order: existing.order || 0, visibilityRule: existing.visibilityRule || EMPTY.visibilityRule } : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const detectedPlatform = detectPlatform(form.url);

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) return toast.error('Title and URL required');
    if (!detectedPlatform) return toast.error('Invalid YouTube or TikTok URL');
    setSaving(true);
    try {
      const payload = { ...form, destination: destId, order: Number(form.order) };
      if (isEditing) {
        await api.patch(`/interview-videos/${existing._id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/interview-videos', payload);
        toast.success('Video added');
      }
      onSaved(); onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{isEditing ? 'Edit Video' : 'Add Video'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className="label">Title *</label>
          <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. How a real SMK interview looks" autoFocus />
        </div>
        <div>
          <label className="label">YouTube / TikTok URL *</label>
          <div className="relative">
            <input className="input pr-20" value={form.url} onChange={set('url')} placeholder="Paste YouTube or TikTok URL" />
            {form.url && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded ${
                detectedPlatform === 'youtube' ? 'bg-red-100 text-red-700' :
                detectedPlatform === 'tiktok'  ? 'bg-gray-900 text-white' :
                'bg-orange-100 text-orange-600'
              }`}>
                {detectedPlatform ? detectedPlatform.toUpperCase() : 'Invalid'}
              </span>
            )}
          </div>
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <input className="input" value={form.description} onChange={set('description')} placeholder="Short context about the video..." />
        </div>
        <div>
          <label className="label">Order</label>
          <input className="input w-24" type="number" min="0" value={form.order} onChange={set('order')} />
        </div>
        <VisibilityInline rule={form.visibilityRule} stageNames={stageNames} onChange={(r) => setForm(p => ({ ...p, visibilityRule: r }))} />
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving || !detectedPlatform} className="btn-primary flex-1">{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Video'}</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function VideosSubTab({ destId, stageNames }) {
  const [videos, setVideos]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);

  const load = () => {
    if (!destId) return;
    setLoading(true);
    api.get(`/interview-videos?destination=${destId}`)
      .then(r => setVideos(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [destId]);

  const toggle = async (v) => {
    try { await api.patch(`/interview-videos/${v._id}/toggle`); load(); }
    catch { toast.error('Failed'); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this video?')) return;
    try { await api.delete(`/interview-videos/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Video
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : videos.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No videos yet. Add YouTube or TikTok interview examples.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map(v => (
            <div key={v._id} className={`card flex items-center gap-3 px-4 py-3 ${!v.active ? 'opacity-50' : ''}`}>
              <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${v.platform === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-gray-900 text-white'}`}>
                {v.platform?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                {v.description && <p className="text-xs text-gray-400 truncate">{v.description}</p>}
              </div>
              <VisibilityBadge rule={v.visibilityRule} />
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(v)} className="p-1 text-gray-400 hover:text-brand-600">
                  {v.active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditing(v); setModalOpen(true); }} className="p-1 text-gray-400 hover:text-brand-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(v._id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && (
        <VideoModal destId={destId} stageNames={stageNames} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={load} existing={editing} />
      )}
    </div>
  );
}

// ── Interview Mistakes Sub-tab ────────────────────────────────────────────────
function MistakeModal({ destId, stageNames, onClose, onSaved, existing }) {
  const isEditing = Boolean(existing);
  const EMPTY = { title: '', explanation: '', tip: '', order: 0, visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } };
  const [form, setForm] = useState(existing ? { title: existing.title, explanation: existing.explanation, tip: existing.tip || '', order: existing.order || 0, visibilityRule: existing.visibilityRule || EMPTY.visibilityRule } : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const save = async () => {
    if (!form.title.trim() || !form.explanation.trim()) return toast.error('Title and explanation required');
    setSaving(true);
    try {
      const payload = { ...form, destination: destId, order: Number(form.order) };
      if (isEditing) {
        await api.patch(`/interview-mistakes/${existing._id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/interview-mistakes', payload);
        toast.success('Mistake added');
      }
      onSaved(); onClose();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{isEditing ? 'Edit Mistake' : 'Add Common Mistake'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className="label">Mistake (title) *</label>
          <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Saying you don't know why you chose Lithuania" autoFocus />
        </div>
        <div>
          <label className="label">Explanation *</label>
          <textarea className="input resize-none" rows={3} value={form.explanation} onChange={set('explanation')} placeholder="Why this is a mistake..." />
        </div>
        <div>
          <label className="label">Tip (what to do instead)</label>
          <textarea className="input resize-none" rows={2} value={form.tip} onChange={set('tip')} placeholder="💡 What to do instead..." />
        </div>
        <div>
          <label className="label">Order</label>
          <input className="input w-24" type="number" min="0" value={form.order} onChange={set('order')} />
        </div>
        <VisibilityInline rule={form.visibilityRule} stageNames={stageNames} onChange={(r) => setForm(p => ({ ...p, visibilityRule: r }))} />
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Mistake'}</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function MistakesSubTab({ destId, stageNames }) {
  const [mistakes, setMistakes]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);

  const load = () => {
    if (!destId) return;
    setLoading(true);
    api.get(`/interview-mistakes?destination=${destId}`)
      .then(r => setMistakes(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [destId]);

  const toggle = async (m) => {
    try { await api.patch(`/interview-mistakes/${m._id}/toggle`); load(); }
    catch { toast.error('Failed'); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this mistake?')) return;
    try { await api.delete(`/interview-mistakes/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Mistake
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : mistakes.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No common mistakes yet. Add mistakes students should avoid in interviews.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mistakes.map(m => (
            <div key={m._id} className={`card flex items-start gap-3 px-4 py-3 ${!m.active ? 'opacity-50' : ''}`}>
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{m.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.explanation}</p>
                {m.tip && <p className="text-xs text-green-600 mt-0.5">💡 Has tip</p>}
              </div>
              <VisibilityBadge rule={m.visibilityRule} />
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(m)} className="p-1 text-gray-400 hover:text-brand-600">
                  {m.active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditing(m); setModalOpen(true); }} className="p-1 text-gray-400 hover:text-brand-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(m._id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && (
        <MistakeModal destId={destId} stageNames={stageNames} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={load} existing={editing} />
      )}
    </div>
  );
}

// ── Updated InterviewTab with sub-tabs ────────────────────────────────────────
function InterviewTabWithSubTabs({ destId, stageNames }) {
  const [subTab, setSubTab] = useState(0);
  const SUB_TABS = ['Questions', 'Videos', 'Common Mistakes'];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {SUB_TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setSubTab(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${subTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {subTab === 0 && <InterviewTab destId={destId} stageNames={stageNames} />}
      {subTab === 1 && <VideosSubTab destId={destId} stageNames={stageNames} />}
      {subTab === 2 && <MistakesSubTab destId={destId} stageNames={stageNames} />}
    </div>
  );
}

// ── FAQ Tab ────────────────────────────────────────────────────────────────────
function FAQItemModal({ destId, stageNames, existingTopics, onClose, onSaved, existing }) {
  const isEditing = Boolean(existing);
  const EMPTY = { topic: '', question: '', answer: '', order: 0, visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } };
  const [form, setForm] = useState(existing ? { topic: existing.topic, question: existing.question, answer: existing.answer, order: existing.order || 0, visibilityRule: existing.visibilityRule || EMPTY.visibilityRule } : EMPTY);
  const [topicInput, setTopicInput] = useState(form.topic);
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleTopicChange = (e) => {
    setTopicInput(e.target.value);
    setForm(p => ({ ...p, topic: e.target.value }));
  };

  const save = async () => {
    if (!form.topic.trim() || !form.question.trim() || !form.answer.trim()) return toast.error('Topic, question, and answer are required');
    setSaving(true);
    try {
      const payload = { ...form, destination: destId || null, order: Number(form.order) };
      if (isEditing) {
        await api.patch(`/faqs/${existing._id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/faqs', payload);
        toast.success('FAQ created');
      }
      onSaved(); onClose();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{isEditing ? 'Edit FAQ' : 'Add FAQ'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className="label">Topic *</label>
          <input
            className="input" value={topicInput} onChange={handleTopicChange}
            placeholder="e.g. MIGRIS, VFS, Accommodation"
            list="faq-topics-list" autoFocus
          />
          <datalist id="faq-topics-list">
            {existingTopics.map(t => <option key={t} value={t} />)}
          </datalist>
          <p className="text-xs text-gray-400 mt-1">Type a new topic or pick an existing one</p>
        </div>
        <div>
          <label className="label">Question *</label>
          <input className="input" value={form.question} onChange={set('question')} placeholder="e.g. How does MIGRIS work?" />
        </div>
        <div>
          <label className="label">Answer *</label>
          <textarea className="input resize-none text-sm" rows={5} value={form.answer} onChange={set('answer')} placeholder="Write the answer students will see..." />
        </div>
        <div>
          <label className="label">Order (within topic)</label>
          <input className="input w-24" type="number" min="0" value={form.order} onChange={set('order')} />
        </div>
        <VisibilityInline rule={form.visibilityRule} stageNames={stageNames} onChange={(r) => setForm(p => ({ ...p, visibilityRule: r }))} />
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add FAQ'}</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function FAQTab({ destId, stageNames }) {
  const [grouped, setGrouped]     = useState({});
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);

  const load = () => {
    if (!destId) return;
    setLoading(true);
    api.get(`/faqs?destination=${destId}`)
      .then(r => setGrouped(r.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [destId]);

  const allItems = Object.values(grouped).flat();
  const existingTopics = Object.keys(grouped);
  const totalCount = allItems.length;

  const toggle = async (item) => {
    try { await api.patch(`/faqs/${item._id}/toggle`); load(); }
    catch { toast.error('Failed'); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    try { await api.delete(`/faqs/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{totalCount} FAQ{totalCount !== 1 ? 's' : ''} across {existingTopics.length} topic{existingTopics.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : totalCount === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No FAQs yet. Add questions and answers students frequently ask.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {existingTopics.map(topic => (
            <div key={topic} className="card overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="font-semibold text-gray-900 text-sm">{topic}</p>
                <span className="text-xs text-gray-400">{grouped[topic].length} Q</span>
              </div>
              <div className="divide-y divide-gray-50">
                {(grouped[topic] || []).map(item => (
                  <div key={item._id} className={`flex items-start gap-3 px-4 py-3 ${!item.active ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{item.question}</p>
                    </div>
                    <VisibilityBadge rule={item.visibilityRule} />
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggle(item)} className="p-1 text-gray-400 hover:text-brand-600">
                        {item.active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditing(item); setModalOpen(true); }} className="p-1 text-gray-400 hover:text-brand-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(item._id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && (
        <FAQItemModal
          destId={destId} stageNames={stageNames} existingTopics={existingTopics}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={load} existing={editing}
        />
      )}
    </div>
  );
}

// Content Map tab — visual stage-gated overview
function ContentMapTab({ stages, articles, topics, videos = [], mistakes = [] }) {
  const getUnlockIdx = (item) => {
    const rule = item.visibilityRule;
    if (!rule || rule.ruleType === 'always') return -1;
    if (rule.ruleType === 'from_stage' || rule.ruleType === 'between_stages') {
      return stages.findIndex(s => s.name === rule.fromStage);
    }
    return -1;
  };

  const allItems = [
    ...articles.map(a => ({ ...a, _kind: ['visa_checklist', 'after_arrival'].includes(a.articleType) ? 'checklist' : a.articleType === 'student_tip' ? 'tip' : 'guide' })),
    ...topics.map(t => ({ ...t, title: t.name, _kind: 'interview' })),
    ...videos.map(v => ({ ...v, _kind: 'video' })),
    ...mistakes.map(m => ({ ...m, _kind: 'mistake' })),
  ];

  const groups = { '__always': [] };
  stages.forEach((_, i) => { groups[i] = []; });
  allItems.forEach(item => {
    const idx = getUnlockIdx(item);
    if (idx === -1 || idx >= stages.length) groups['__always'].push(item);
    else { if (!groups[idx]) groups[idx] = []; groups[idx].push(item); }
  });

  const kindConfig = {
    guide:     { color: 'bg-blue-100 text-blue-700',    emoji: '📚' },
    checklist: { color: 'bg-green-100 text-green-700',  emoji: '📋' },
    interview: { color: 'bg-purple-100 text-purple-700', emoji: '🎤' },
    tip:       { color: 'bg-yellow-100 text-yellow-700', emoji: '💡' },
    video:     { color: 'bg-red-100 text-red-700',       emoji: '🎬' },
    mistake:   { color: 'bg-orange-100 text-orange-700', emoji: '⚠️' },
  };

  if (allItems.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400 text-sm">No student-facing content yet for this destination.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups['__always'].length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
            <p className="font-semibold text-green-800 text-sm">Always Available</p>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {groups['__always'].map((item, i) => {
              const k = kindConfig[item._kind] || kindConfig.guide;
              return <span key={i} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${k.color}`}>{k.emoji} {item.title}</span>;
            })}
          </div>
        </div>
      )}
      {stages.map((stage, idx) => {
        const items = groups[idx] || [];
        if (items.length === 0) return null;
        return (
          <div key={stage._id} className="card overflow-hidden">
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <p className="font-semibold text-indigo-800 text-sm">Unlocks at: {stage.name}</p>
                <span className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">Stage {idx + 1}</span>
              </div>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {items.map((item, i) => {
                const k = kindConfig[item._kind] || kindConfig.guide;
                return <span key={i} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${k.color}`}>{k.emoji} {item.title}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Progress Content Tab ──────────────────────────────────────────────────────
function StageContentEditor({ destId, stage, onSaved }) {
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTip, setNewTip] = useState('');
  const [form, setForm]     = useState({
    studentDescription:    stage.studentDescription    || '',
    studentWaitingFor:     stage.studentWaitingFor     || '',
    studentActionRequired: stage.studentActionRequired || '',
    estimatedDays:         stage.estimatedDays != null ? String(stage.estimatedDays) : '',
    studentTips:           [...(stage.studentTips || [])],
  });

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

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
        studentDescription:    form.studentDescription,
        studentWaitingFor:     form.studentWaitingFor,
        studentActionRequired: form.studentActionRequired,
        estimatedDays:         form.estimatedDays === '' ? null : Number(form.estimatedDays),
        studentTips:           form.studentTips,
      });
      toast.success('Stage content saved');
      onSaved();
      setOpen(false);
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const hasContent = stage.studentDescription || stage.studentWaitingFor || stage.studentActionRequired;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center shrink-0">
            {stage.order + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{stage.name}</p>
            {hasContent
              ? <p className="text-xs text-green-600 mt-0.5">Has student content</p>
              : <p className="text-xs text-amber-500 mt-0.5">No student content yet</p>
            }
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          <div>
            <label className="label">What's happening at this stage</label>
            <textarea
              className="input resize-none text-sm" rows={3}
              value={form.studentDescription} onChange={set('studentDescription')}
              placeholder="Describe what's happening at this stage..."
            />
          </div>
          <div>
            <label className="label">What we're waiting for</label>
            <input className="input" value={form.studentWaitingFor} onChange={set('studentWaitingFor')} placeholder="e.g. University response to your application" />
          </div>
          <div>
            <label className="label">Action required from student</label>
            <input className="input" value={form.studentActionRequired} onChange={set('studentActionRequired')} placeholder="e.g. Prepare your IELTS certificate" />
          </div>
          <div>
            <label className="label">Estimated days at this stage</label>
            <input className="input w-32" type="number" min="0" value={form.estimatedDays} onChange={set('estimatedDays')} placeholder="e.g. 30" />
          </div>
          <div>
            <label className="label">Tips for students at this stage</label>
            <div className="space-y-2">
              {form.studentTips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700">💡 {tip}</span>
                  <button onClick={() => removeTip(i)} className="p-1 text-gray-400 hover:text-red-500 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm" value={newTip}
                  onChange={e => setNewTip(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTip())}
                  placeholder="Add a tip and press Enter…"
                />
                <button onClick={addTip} className="btn-secondary text-sm px-3">Add</button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
            <button onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Save Stage Content'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressContentTab({ destId, stages, onSaved }) {
  if (!destId || stages.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400 text-sm">No pipeline stages configured for this destination.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Edit what students see in the Progress screen at each stage — description, waiting status, required actions, and tips.
      </p>
      {stages.map(stage => (
        <StageContentEditor key={stage._id} destId={destId} stage={stage} onSaved={onSaved} />
      ))}
    </div>
  );
}

// ── Main Content Manager ──
const TABS = ['Interview Preparation', 'Guides', 'FAQ', 'Progress Content', 'Announcements', 'Content Map'];

export default function ContentManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinations, setDestinations] = useState([]);
  const [destId, setDestId]             = useState(searchParams.get('dest') || '');
  const [tab, setTab]                   = useState(0);
  const [allArticles, setAllArticles]   = useState([]);
  const [topics, setTopics]             = useState([]);
  const [videos, setVideos]             = useState([]);
  const [mistakes, setMistakes]         = useState([]);
  const [loadingArt, setLoadingArt]     = useState(false);

  const loadDestinations = () => {
    api.get('/destinations').then(r => setDestinations(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/destinations').then(r => {
      setDestinations(r.data);
      if (!destId && r.data.length > 0) setDestId(r.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!destId) return;
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('dest', destId); return p; });
    setLoadingArt(true);
    Promise.all([
      api.get(`/kb?destination=${destId}&studentFacing=true`),
      api.get(`/interview-topics?destination=${destId}`),
      api.get(`/interview-videos?destination=${destId}`),
      api.get(`/interview-mistakes?destination=${destId}`),
    ]).then(([aRes, tRes, vRes, mRes]) => {
      setAllArticles(aRes.data || []);
      setTopics(tRes.data || []);
      setVideos(vRes.data || []);
      setMistakes(mRes.data || []);
    }).catch(() => {}).finally(() => setLoadingArt(false));
  }, [destId]);

  const dest       = destinations.find(d => d._id === destId);
  const stageNames = (dest?.pipelineStages || []).sort((a, b) => a.order - b.order).map(s => s.name).filter(Boolean);
  const stages     = (dest?.pipelineStages || []).sort((a, b) => a.order - b.order);
  const destName   = dest?.name || '';

  const refresh = () => {
    if (!destId) return;
    setLoadingArt(true);
    Promise.all([
      api.get(`/kb?destination=${destId}&studentFacing=true`),
      api.get(`/interview-topics?destination=${destId}`),
      api.get(`/interview-videos?destination=${destId}`),
      api.get(`/interview-mistakes?destination=${destId}`),
    ]).then(([aRes, tRes, vRes, mRes]) => {
      setAllArticles(aRes.data || []);
      setTopics(tRes.data || []);
      setVideos(vRes.data || []);
      setMistakes(mRes.data || []);
    }).catch(() => {}).finally(() => setLoadingArt(false));
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all student-facing content in the PWA</p>
        </div>
      </div>

      {/* Destination selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-600">Destination:</label>
        <select className="input w-52 text-sm" value={destId} onChange={e => setDestId(e.target.value)}>
          {destinations.map(d => <option key={d._id} value={d._id}>{d.flag} {d.name}</option>)}
        </select>
        {dest && stageNames.length > 0 && (
          <span className="text-xs text-gray-400">{stageNames.length} stages · {allArticles.length} articles · {topics.length} topics</span>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${tab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <InterviewTabWithSubTabs destId={destId} stageNames={stageNames} />}
      {tab === 1 && <StudentGuidesTab destId={destId} destName={destName} stageNames={stageNames} />}
      {tab === 2 && <FAQTab destId={destId} stageNames={stageNames} />}
      {tab === 3 && <ProgressContentTab destId={destId} stages={stages} onSaved={loadDestinations} />}
      {tab === 4 && <AnnouncementsPage />}
      {tab === 5 && <ContentMapTab stages={stages} articles={allArticles} topics={topics} videos={videos} mistakes={mistakes} />}
    </div>
  );
}
