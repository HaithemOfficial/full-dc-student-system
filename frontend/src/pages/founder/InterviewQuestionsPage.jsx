import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, Tag, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const BLANK_Q = { destination: '', topic: '', topicId: '', question: '', answerTip: '', order: 0 };
const BLANK_TOPIC = { name: '', description: '', order: 0, visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } };

const RULE_LABELS = { always: 'Always visible', from_stage: 'From stage', until_stage: 'Until stage', between_stages: 'Between stages' };

function VisibilityBadge({ rule }) {
  if (!rule || rule.ruleType === 'always') return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">
      <Lock className="w-2.5 h-2.5" />
      {RULE_LABELS[rule.ruleType] || rule.ruleType}
    </span>
  );
}

export default function InterviewQuestionsPage() {
  const [destinations, setDestinations] = useState([]);
  const [destId, setDestId] = useState('');
  const [grouped, setGrouped] = useState({});
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTopicsManager, setShowTopicsManager] = useState(false);

  // Question modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_Q);
  const [saving, setSaving] = useState(false);

  // Topic modal
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState(BLANK_TOPIC);
  const [savingTopic, setSavingTopic] = useState(false);

  const [expandedTopics, setExpandedTopics] = useState({});

  const dest = destinations.find(d => d._id === destId);
  const stageNames = (dest?.pipelineStages || []).map(s => s.name).filter(Boolean);

  useEffect(() => {
    api.get('/destinations').then(r => {
      setDestinations(r.data);
      if (r.data.length > 0) setDestId(r.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!destId) return;
    setLoading(true);
    Promise.all([
      api.get(`/interview-questions?destination=${destId}`),
      api.get(`/interview-topics?destination=${destId}`),
    ])
      .then(([qRes, tRes]) => { setGrouped(qRes.data); setTopics(tRes.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [destId]);

  const reloadQuestions = () => {
    if (!destId) return;
    api.get(`/interview-questions?destination=${destId}`).then(r => setGrouped(r.data));
  };
  const reloadTopics = () => {
    if (!destId) return;
    api.get(`/interview-topics?destination=${destId}`).then(r => setTopics(r.data));
  };

  // ── Question actions ──
  const openNew = () => {
    setEditing(null);
    setForm({ ...BLANK_Q, destination: destId });
    setModalOpen(true);
  };
  const openEdit = (q) => {
    setEditing(q);
    setForm({ destination: destId, topic: q.topic || '', topicId: q.topicId || '', question: q.question, answerTip: q.answerTip || '', order: q.order || 0 });
    setModalOpen(true);
  };
  const saveQuestion = async () => {
    if (!form.question.trim()) return toast.error('Question is required');
    if (!form.topicId && !form.topic.trim()) return toast.error('Topic is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/interview-questions/${editing._id}`, form);
        toast.success('Question updated');
      } else {
        await api.post('/interview-questions', form);
        toast.success('Question added');
      }
      setModalOpen(false);
      reloadQuestions();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };
  const removeQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/interview-questions/${id}`);
      toast.success('Deleted');
      reloadQuestions();
    } catch {
      toast.error('Failed to delete');
    }
  };
  const toggleActive = async (q) => {
    try {
      await api.put(`/interview-questions/${q._id}`, { active: !q.active });
      reloadQuestions();
    } catch {
      toast.error('Failed to toggle');
    }
  };

  // ── Topic actions ──
  const openNewTopic = () => {
    setEditingTopic(null);
    setTopicForm({ ...BLANK_TOPIC, visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' } });
    setTopicModalOpen(true);
  };
  const openEditTopic = (t) => {
    setEditingTopic(t);
    setTopicForm({
      name: t.name,
      description: t.description || '',
      order: t.order || 0,
      visibilityRule: t.visibilityRule || { ruleType: 'always', fromStage: '', toStage: '' },
    });
    setTopicModalOpen(true);
  };
  const saveTopic = async () => {
    if (!topicForm.name.trim()) return toast.error('Topic name is required');
    setSavingTopic(true);
    try {
      if (editingTopic) {
        await api.put(`/interview-topics/${editingTopic._id}`, topicForm);
        toast.success('Topic updated');
      } else {
        await api.post('/interview-topics', { ...topicForm, destination: destId });
        toast.success('Topic created');
      }
      setTopicModalOpen(false);
      reloadTopics();
    } catch {
      toast.error('Failed to save topic');
    } finally {
      setSavingTopic(false);
    }
  };
  const removeTopic = async (id) => {
    if (!confirm('Delete this topic? Questions linked to it will become legacy (topic string only).')) return;
    try {
      await api.delete(`/interview-topics/${id}`);
      toast.success('Topic deleted');
      reloadTopics();
      reloadQuestions();
    } catch {
      toast.error('Failed to delete topic');
    }
  };
  const toggleTopicActive = async (t) => {
    try {
      await api.put(`/interview-topics/${t._id}`, { active: !t.active });
      reloadTopics();
    } catch {
      toast.error('Failed to toggle topic');
    }
  };

  const toggleExpand = (key) => setExpandedTopics(p => ({ ...p, [key]: !p[key] }));

  const totalCount = Object.values(grouped).flat().length;
  const setRule = (field) => (e) =>
    setTopicForm(p => ({ ...p, visibilityRule: { ...(p.visibilityRule || {}), [field]: e.target.value } }));
  const rule = topicForm.visibilityRule || { ruleType: 'always', fromStage: '', toStage: '' };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Questions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visa interview prep content for students</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Destination filter */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-medium text-gray-600">Destination:</label>
        <select className="input w-48 text-sm" value={destId} onChange={e => setDestId(e.target.value)}>
          {destinations.map(d => <option key={d._id} value={d._id}>{d.flag} {d.name}</option>)}
        </select>
        {totalCount > 0 && <span className="text-xs text-gray-400">{totalCount} question{totalCount !== 1 ? 's' : ''}</span>}
      </div>

      {/* Topics Manager */}
      {destId && (
        <div className="card mb-5 overflow-hidden">
          <button
            onClick={() => setShowTopicsManager(p => !p)}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-start"
          >
            {showTopicsManager ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            <Tag className="w-4 h-4 text-indigo-500" />
            <span className="flex-1 font-semibold text-gray-800">Manage Topics</span>
            <span className="text-xs text-gray-400 font-medium">{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
          </button>
          {showTopicsManager && (
            <div className="border-t border-gray-100 p-4 space-y-2">
              {topics.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No structured topics yet. Questions use legacy topic strings.</p>
              )}
              {topics.map(t => (
                <div key={t._id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${t.active ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{t.name}</span>
                      <VisibilityBadge rule={t.visibilityRule} />
                    </div>
                    {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>}
                  </div>
                  <button onClick={() => toggleTopicActive(t)} className="p-1 text-gray-400 hover:text-brand-600 transition-colors">
                    {t.active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEditTopic(t)} className="p-1 text-gray-400 hover:text-brand-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeTopic(t._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={openNewTopic} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mt-2">
                <Plus className="w-4 h-4" /> Add topic
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-2">🎤</p>
          <p className="font-semibold text-gray-700">No questions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add interview questions for {dest?.name || 'this destination'} to help students prepare
          </p>
          <button onClick={openNew} className="btn-primary mt-4">Add first question</button>
        </div>
      )}

      {!loading && Object.keys(grouped).length > 0 && (
        <div className="space-y-3">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([topic, questions]) => {
            const isOpen = expandedTopics[topic] !== false;
            // Check if topic has a visibility rule
            const matchedTopic = topics.find(t => t.name === topic);
            return (
              <div key={topic} className="card overflow-hidden">
                <button
                  onClick={() => toggleExpand(topic)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-start"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <span className="flex-1 font-semibold text-gray-800">{topic}</span>
                  {matchedTopic && <VisibilityBadge rule={matchedTopic.visibilityRule} />}
                  <span className="text-xs text-gray-400 font-medium">{questions.length} Q</span>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {questions.map(q => (
                      <div key={q._id} className={`flex items-start gap-3 px-4 py-3 ${!q.active ? 'opacity-50' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{q.question}</p>
                          {q.answerTip && <p className="text-xs text-gray-400 mt-1 leading-relaxed">💡 {q.answerTip}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          <button onClick={() => toggleActive(q)} title={q.active ? 'Disable' : 'Enable'} className="p-1 text-gray-400 hover:text-brand-600 transition-colors">
                            {q.active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(q)} className="p-1 text-gray-400 hover:text-brand-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeQuestion(q._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Question Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Question' : 'Add Question'}</h3>

            <div>
              <label className="label">Topic</label>
              {topics.length > 0 ? (
                <select
                  className="input"
                  value={form.topicId || ''}
                  onChange={e => {
                    const t = topics.find(t => t._id === e.target.value);
                    setForm(p => ({ ...p, topicId: e.target.value, topic: t?.name || '' }));
                  }}
                >
                  <option value="">Select topic...</option>
                  {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  <option value="__legacy">Legacy (type custom)</option>
                </select>
              ) : null}
              {(topics.length === 0 || form.topicId === '__legacy') && (
                <input
                  className={`input ${topics.length > 0 ? 'mt-2' : ''}`}
                  value={form.topic}
                  onChange={e => setForm(p => ({ ...p, topic: e.target.value, topicId: '' }))}
                  placeholder="e.g. Study Plans, Financial Proof..."
                  list="topics-datalist"
                  autoFocus={topics.length === 0}
                />
              )}
              <datalist id="topics-datalist">
                {Object.keys(grouped).map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div>
              <label className="label">Question</label>
              <textarea
                className="input min-h-[80px] resize-none"
                value={form.question}
                onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                placeholder="Why did you choose this country?"
                autoFocus={topics.length > 0}
              />
            </div>

            <div>
              <label className="label">Answer tip <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="input min-h-[72px] resize-none"
                value={form.answerTip}
                onChange={e => setForm(p => ({ ...p, answerTip: e.target.value }))}
                placeholder="Hint shown to the student when they expand this question..."
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={saveQuestion} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Question'}
              </button>
              <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {topicModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h3>

            <div>
              <label className="label">Topic name *</label>
              <input
                className="input"
                value={topicForm.name}
                onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Study Plans, Financial Proof..."
                autoFocus
              />
            </div>

            <div>
              <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="input"
                value={topicForm.description}
                onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description shown in the student app..."
              />
            </div>

            <div>
              <label className="label">Order</label>
              <input
                className="input w-24"
                type="number"
                min="0"
                value={topicForm.order}
                onChange={e => setTopicForm(p => ({ ...p, order: Number(e.target.value) }))}
              />
            </div>

            {/* Visibility rule */}
            <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-700">Visibility rule</p>
              <div>
                <label className="label text-xs">When is this topic visible?</label>
                <select className="input text-sm" value={rule.ruleType || 'always'} onChange={setRule('ruleType')}>
                  <option value="always">Always visible</option>
                  <option value="from_stage">From a stage onwards</option>
                  <option value="until_stage">Until a stage (then hidden)</option>
                  <option value="between_stages">Between two stages</option>
                </select>
              </div>
              {(rule.ruleType === 'from_stage' || rule.ruleType === 'between_stages') && (
                <div>
                  <label className="label text-xs">From stage</label>
                  {stageNames.length > 0 ? (
                    <select className="input text-sm" value={rule.fromStage || ''} onChange={setRule('fromStage')}>
                      <option value="">Select stage...</option>
                      {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input className="input text-sm" value={rule.fromStage || ''} onChange={setRule('fromStage')} placeholder="Stage name..." />
                  )}
                </div>
              )}
              {(rule.ruleType === 'until_stage' || rule.ruleType === 'between_stages') && (
                <div>
                  <label className="label text-xs">Until stage</label>
                  {stageNames.length > 0 ? (
                    <select className="input text-sm" value={rule.toStage || ''} onChange={setRule('toStage')}>
                      <option value="">Select stage...</option>
                      {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input className="input text-sm" value={rule.toStage || ''} onChange={setRule('toStage')} placeholder="Stage name..." />
                  )}
                </div>
              )}
              {rule.ruleType === 'always' && (
                <p className="text-xs text-indigo-500">This topic is always shown to students regardless of their stage.</p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={saveTopic} disabled={savingTopic} className="btn-primary flex-1">
                {savingTopic ? 'Saving...' : editingTopic ? 'Save Changes' : 'Add Topic'}
              </button>
              <button onClick={() => setTopicModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
