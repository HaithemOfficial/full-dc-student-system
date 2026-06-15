import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import RichTextEditor from '../../components/kb/RichTextEditor';

const BLANK_DESTINATION = {
  type: 'destination',
  title: '',
  status: 'draft',
  destinationRef: '',
  destinationName: '',
  countryCode: '',
  flag: '',
  overview: '',
  faqs: [],
  steps: [],
  deadlines: [],
  requiredDocuments: [],
  financialRequirements: '',
  commonMistakes: [],
  agentTips: '',
  articleType: null,
  studentFacing: false,
  linkedStage: '',
  visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' },
};

const BLANK_UNIVERSITY = {
  type: 'university',
  title: '',
  status: 'draft',
  destinationRef: '',
  destinationName: '',
  universityName: '',
  city: '',
  programs: [],
  intakes: [],
  applicationRequirements: '',
  admissionProfile: '',
  processingTime: '',
  isPartner: false,
  contactEmail: '',
  contactPerson: '',
  internalNotes: '',
  articleType: null,
  studentFacing: false,
  linkedStage: '',
  visibilityRule: { ruleType: 'always', fromStage: '', toStage: '' },
};

const ARTICLE_TYPES = [
  { value: 'destination_overview', label: 'Destination Overview' },
  { value: 'university_info', label: 'University Info' },
  { value: 'visa_checklist', label: 'Visa Checklist' },
  { value: 'after_arrival', label: 'After Arrival' },
  { value: 'student_tip', label: 'Student Tip' },
];

const DEST_TABS = ['Basic', 'General', 'Process & Deadlines', 'Documents', 'Internal'];
const UNI_TABS  = ['Basic', 'Programs & Intakes', 'Requirements', 'Internal'];

function Label({ children, note }) {
  return (
    <label className="label">
      {children}
      {note && <span className="text-gray-300 font-normal ml-1.5">— {note}</span>}
    </label>
  );
}

function SectionTitle({ children, muted }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className={`text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${muted ? 'text-slate-400' : 'text-gray-400'}`}>
        {children}
      </p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function StudentFacingFields({ form, mutateForm, stageNames = [] }) {
  const rule = form.visibilityRule || { ruleType: 'always', fromStage: '', toStage: '' };
  const setRule = (field) => (e) =>
    mutateForm(p => ({ ...p, visibilityRule: { ...(p.visibilityRule || {}), [field]: e.target.value } }));

  return (
    <div className="border-t border-gray-100 pt-4 space-y-3">
      <div className="flex items-center gap-3">
        <input
          id="studentFacing"
          type="checkbox"
          checked={form.studentFacing || false}
          onChange={e => mutateForm(p => ({ ...p, studentFacing: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-brand-600"
        />
        <label htmlFor="studentFacing" className="text-sm font-medium text-gray-700 cursor-pointer">
          Visible to students in the Student App
        </label>
      </div>
      {form.studentFacing && (
        <div className="pl-7 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Article type for students</Label>
              <select
                className="input"
                value={form.articleType || ''}
                onChange={e => mutateForm(p => ({ ...p, articleType: e.target.value || null }))}
              >
                <option value="">Select type...</option>
                {ARTICLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label note="Optional">Linked stage name</Label>
              <input
                className="input"
                value={form.linkedStage || ''}
                onChange={e => mutateForm(p => ({ ...p, linkedStage: e.target.value }))}
                placeholder="e.g. Visa Application"
              />
            </div>
          </div>

          {/* Visibility rule */}
          <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-indigo-700">Visibility rule</p>
            <div>
              <Label>When is this visible?</Label>
              <select className="input text-sm" value={rule.ruleType || 'always'} onChange={setRule('ruleType')}>
                <option value="always">Always visible</option>
                <option value="from_stage">From a stage onwards</option>
                <option value="until_stage">Until a stage (then hidden)</option>
                <option value="between_stages">Between two stages</option>
              </select>
            </div>
            {(rule.ruleType === 'from_stage' || rule.ruleType === 'between_stages') && (
              <div>
                <Label>From stage</Label>
                <select className="input text-sm" value={rule.fromStage || ''} onChange={setRule('fromStage')}>
                  <option value="">Select stage...</option>
                  {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {(rule.ruleType === 'until_stage' || rule.ruleType === 'between_stages') && (
              <div>
                <Label>Until stage</Label>
                <select className="input text-sm" value={rule.toStage || ''} onChange={setRule('toStage')}>
                  <option value="">Select stage...</option>
                  {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {rule.ruleType === 'always' && (
              <p className="text-xs text-indigo-500">This article is always shown to students regardless of their stage.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KBArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm]           = useState(BLANK_DESTINATION);
  const [destinations, setDests]  = useState([]);
  const [loading, setLoading]     = useState(isEditing);
  const [saving, setSaving]       = useState(false);
  const [isDirty, setIsDirty]     = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    api.get('/destinations').then(r => setDests(r.data));
    if (isEditing) {
      api.get(`/kb/${id}`).then(r => { setForm(r.data); setLoading(false); });
    }
  }, [id]);

  const mutateForm = (updater) => { setIsDirty(true); setForm(updater); };

  const set = (field) => (e) =>
    mutateForm(p => ({ ...p, [field]: e.target ? e.target.value : e }));

  const setRich = (field) => (html) =>
    mutateForm(p => ({ ...p, [field]: html }));

  const setType = (type) => {
    setActiveTab(0);
    mutateForm(() => type === 'destination' ? { ...BLANK_DESTINATION } : { ...BLANK_UNIVERSITY });
  };

  const handleDestPick = (e) => {
    const dest = destinations.find(d => d._id === e.target.value);
    mutateForm(p => ({
      ...p,
      destinationRef: e.target.value,
      destinationName: dest?.name || '',
      countryCode: dest?.code || '',
      flag: dest?.flag || '',
      title: p.type === 'destination' ? (dest?.name || p.title) : p.title,
    }));
  };

  // Steps
  const addStep    = ()          => mutateForm(p => ({ ...p, steps: [...(p.steps||[]), { title: '', description: '' }] }));
  const setStep    = (i, f, v)   => mutateForm(p => { const a = [...(p.steps||[])]; a[i] = { ...a[i], [f]: v }; return { ...p, steps: a }; });
  const removeStep = (i)         => mutateForm(p => ({ ...p, steps: (p.steps||[]).filter((_,j) => j !== i) }));

  // Deadlines
  const addDeadline    = ()        => mutateForm(p => ({ ...p, deadlines: [...(p.deadlines||[]), { label: '', date: '', notes: '' }] }));
  const setDeadline    = (i, f, v) => mutateForm(p => { const a = [...(p.deadlines||[])]; a[i] = { ...a[i], [f]: v }; return { ...p, deadlines: a }; });
  const removeDeadline = (i)       => mutateForm(p => ({ ...p, deadlines: (p.deadlines||[]).filter((_,j) => j !== i) }));

  // Required documents
  const addDoc    = ()        => mutateForm(p => ({ ...p, requiredDocuments: [...(p.requiredDocuments||[]), { name: '', notes: '' }] }));
  const setDoc    = (i, f, v) => mutateForm(p => { const a = [...(p.requiredDocuments||[])]; a[i] = { ...a[i], [f]: v }; return { ...p, requiredDocuments: a }; });
  const removeDoc = (i)       => mutateForm(p => ({ ...p, requiredDocuments: (p.requiredDocuments||[]).filter((_,j) => j !== i) }));

  // FAQs
  const addFaq    = ()        => mutateForm(p => ({ ...p, faqs: [...(p.faqs||[]), { question: '', answer: '' }] }));
  const setFaq    = (i, f, v) => mutateForm(p => { const a = [...(p.faqs||[])]; a[i] = { ...a[i], [f]: v }; return { ...p, faqs: a }; });
  const removeFaq = (i)       => mutateForm(p => ({ ...p, faqs: (p.faqs||[]).filter((_,j) => j !== i) }));

  // Common mistakes
  const addMistake    = ()       => mutateForm(p => ({ ...p, commonMistakes: [...(p.commonMistakes||[]), ''] }));
  const setMistake    = (i, v)   => mutateForm(p => { const a = [...(p.commonMistakes||[])]; a[i] = v; return { ...p, commonMistakes: a }; });
  const removeMistake = (i)      => mutateForm(p => ({ ...p, commonMistakes: (p.commonMistakes||[]).filter((_,j) => j !== i) }));

  // Programs
  const addProgram    = ()        => mutateForm(p => ({ ...p, programs: [...(p.programs||[]), { name: '', tuitionFee: '', language: '' }] }));
  const setProgram    = (i, f, v) => mutateForm(p => { const a = [...(p.programs||[])]; a[i] = { ...a[i], [f]: v }; return { ...p, programs: a }; });
  const removeProgram = (i)       => mutateForm(p => ({ ...p, programs: (p.programs||[]).filter((_,j) => j !== i) }));

  // Intakes
  const addIntake    = ()        => mutateForm(p => ({ ...p, intakes: [...(p.intakes||[]), { semester: '', applicationDeadline: '', startDate: '', notes: '' }] }));
  const setIntake    = (i, f, v) => mutateForm(p => { const a = [...(p.intakes||[])]; a[i] = { ...a[i], [f]: v }; return { ...p, intakes: a }; });
  const removeIntake = (i)       => mutateForm(p => ({ ...p, intakes: (p.intakes||[]).filter((_,j) => j !== i) }));

  const handleSave = async (publishAfter = false) => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = { ...form };
      if (publishAfter) payload.status = 'published';
      if (payload.faqs)              payload.faqs              = payload.faqs.filter(f => f.question.trim());
      if (payload.steps)             payload.steps             = payload.steps.filter(s => s.title.trim());
      if (payload.deadlines)         payload.deadlines         = payload.deadlines.filter(d => d.label.trim());
      if (payload.programs)          payload.programs          = payload.programs.filter(p => p.name.trim());
      if (payload.requiredDocuments) payload.requiredDocuments = payload.requiredDocuments.filter(d => d.name.trim());
      if (payload.commonMistakes)    payload.commonMistakes    = payload.commonMistakes.filter(m => m.trim());
      if (payload.intakes)           payload.intakes           = payload.intakes.filter(i => i.semester?.trim() || i.applicationDeadline);

      if (isEditing) {
        await api.patch(`/kb/${id}`, payload);
        setIsDirty(false);
        toast.success('Article saved');
        navigate(`/kb/${id}`);
      } else {
        const { data } = await api.post('/kb', payload);
        setIsDirty(false);
        toast.success('Article created');
        navigate(`/kb/${data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isDestination = form.type === 'destination';
  const tabs = isDestination ? DEST_TABS : UNI_TABS;
  const stageNames = (destinations.find(d => d._id === form.destinationRef)?.pipelineStages || []).map(s => s.name).filter(Boolean);
  const steps = form.steps || [];
  const deadlines = form.deadlines || [];
  const faqs = form.faqs || [];
  const docs = form.requiredDocuments || [];
  const mistakes = form.commonMistakes || [];
  const programs = form.programs || [];
  const intakes = form.intakes || [];

  return (
    <div className="max-w-3xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link to={isEditing ? `/kb/${id}` : '/kb'} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-bold text-gray-900">
          {isEditing ? `Edit: ${form.title || 'Article'}` : 'New Article'}
        </h2>
      </div>

      {/* Type selector — new articles only */}
      {!isEditing && (
        <div className="card p-5 space-y-3 mb-5">
          <Label>Article Type</Label>
          <div className="flex gap-3">
            {[
              { id: 'destination', label: '🌍 Destination Guide' },
              { id: 'university',  label: '🎓 University' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.type === t.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════
          DESTINATION TABS
      ═══════════════════════════════════ */}
      {isDestination && (
        <>
          {/* ── Tab 0: Basic ── */}
          {activeTab === 0 && (
            <div className="card p-5 space-y-4">
              <div>
                <Label>Destination</Label>
                <select className="input" value={form.destinationRef} onChange={handleDestPick}>
                  <option value="">Select destination...</option>
                  {destinations.map(d => (
                    <option key={d._id} value={d._id}>{d.flag} {d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Flag</Label>
                  <input className="input" value={form.flag} onChange={set('flag')} placeholder="🇱🇹" />
                </div>
                <div>
                  <Label>Country Code</Label>
                  <input className="input" value={form.countryCode} onChange={set('countryCode')} placeholder="LT" maxLength={3} />
                </div>
                <div className="col-span-2">
                  <Label>Article Title *</Label>
                  <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Lithuania — Study Guide" />
                </div>
              </div>
              <StudentFacingFields form={form} mutateForm={mutateForm} stageNames={stageNames} />
            </div>
          )}

          {/* ── Tab 1: General ── */}
          {activeTab === 1 && (
            <div className="space-y-5">
              <div className="card p-5 space-y-3">
                <SectionTitle>General Overview</SectionTitle>
                <RichTextEditor
                  value={form.overview}
                  onChange={setRich('overview')}
                  placeholder="General description of this destination — why students choose it, what to expect, cost of living, culture..."
                  minHeight={200}
                />
              </div>

              <div className="card p-5">
                <SectionTitle>Frequently Asked Questions</SectionTitle>
                <div className="space-y-3">
                  {faqs.map((faq, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Q{i + 1}</span>
                        <button onClick={() => removeFaq(i)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        className="input text-sm bg-white font-medium"
                        value={faq.question}
                        onChange={e => setFaq(i, 'question', e.target.value)}
                        placeholder="Question..."
                      />
                      <textarea
                        className="input text-sm bg-white resize-none w-full"
                        rows={2}
                        value={faq.answer}
                        onChange={e => setFaq(i, 'answer', e.target.value)}
                        placeholder="Answer..."
                      />
                    </div>
                  ))}
                  <button
                    onClick={addFaq}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-1"
                  >
                    <Plus className="w-4 h-4" /> Add question
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Process & Deadlines ── */}
          {activeTab === 2 && (
            <div className="space-y-5">
              {/* Steps */}
              <div className="card p-5">
                <SectionTitle>Process Steps</SectionTitle>
                <div>
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      {/* Circle + connector */}
                      <div className="flex flex-col items-center shrink-0 pt-1.5">
                        <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="w-px flex-1 min-h-8 bg-brand-100 my-1" />
                        )}
                      </div>
                      {/* Inputs */}
                      <div className={`flex-1 space-y-2 ${i < steps.length - 1 ? 'pb-4' : 'pb-0'}`}>
                        <div className="flex gap-2">
                          <input
                            className="input text-sm flex-1"
                            value={step.title}
                            onChange={e => setStep(i, 'title', e.target.value)}
                            placeholder="Step title *"
                          />
                          <button
                            onClick={() => removeStep(i)}
                            className="p-2 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          className="input text-sm resize-none w-full"
                          rows={2}
                          value={step.description}
                          onChange={e => setStep(i, 'description', e.target.value)}
                          placeholder="Details or instructions (optional)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addStep}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-3"
                >
                  <Plus className="w-4 h-4" /> Add step
                </button>
              </div>

              {/* Deadlines */}
              <div className="card p-5">
                <SectionTitle>Key Deadlines</SectionTitle>
                <div className="space-y-2">
                  {deadlines.length > 0 && (
                    <div className="grid grid-cols-[1fr_9rem_1fr_2rem] gap-2 px-1 mb-1">
                      <p className="text-xs text-gray-400">Label</p>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-xs text-gray-400">Notes</p>
                      <div />
                    </div>
                  )}
                  {deadlines.map((dl, i) => (
                    <div key={i} className="grid grid-cols-[1fr_9rem_1fr_2rem] gap-2 items-center">
                      <input
                        className="input text-sm"
                        value={dl.label}
                        onChange={e => setDeadline(i, 'label', e.target.value)}
                        placeholder="e.g. Application deadline"
                      />
                      <input
                        className="input text-sm"
                        type="date"
                        value={dl.date}
                        onChange={e => setDeadline(i, 'date', e.target.value)}
                      />
                      <input
                        className="input text-sm"
                        value={dl.notes}
                        onChange={e => setDeadline(i, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                      />
                      <button
                        onClick={() => removeDeadline(i)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors justify-self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addDeadline}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-1"
                  >
                    <Plus className="w-4 h-4" /> Add deadline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: Documents & Finance ── */}
          {activeTab === 3 && (
            <div className="space-y-5">
              {/* Required documents */}
              <div className="card p-5">
                <SectionTitle>Required Documents</SectionTitle>
                <div className="space-y-2">
                  {docs.length > 0 && (
                    <div className="grid grid-cols-[1.5rem_1fr_1fr_2rem] gap-2 px-1 mb-1">
                      <div />
                      <p className="text-xs text-gray-400">Document name</p>
                      <p className="text-xs text-gray-400">Notes</p>
                      <div />
                    </div>
                  )}
                  {docs.map((doc, i) => (
                    <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_2rem] gap-2 items-center">
                      <span className="text-xs font-bold text-gray-300 text-center">{i + 1}</span>
                      <input
                        className="input text-sm"
                        value={doc.name}
                        onChange={e => setDoc(i, 'name', e.target.value)}
                        placeholder="e.g. Passport copy"
                      />
                      <input
                        className="input text-sm"
                        value={doc.notes}
                        onChange={e => setDoc(i, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                      />
                      <button
                        onClick={() => removeDoc(i)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors justify-self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addDoc}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-1"
                  >
                    <Plus className="w-4 h-4" /> Add document
                  </button>
                </div>
              </div>

              {/* Financial requirements */}
              <div className="card p-5">
                <SectionTitle>Financial Requirements</SectionTitle>
                <textarea
                  className="input resize-none w-full text-sm"
                  rows={5}
                  value={form.financialRequirements}
                  onChange={set('financialRequirements')}
                  placeholder="e.g. Minimum bank balance €5,000 (last 3 months). Health insurance required. Proof of accommodation."
                />
              </div>
            </div>
          )}

          {/* ── Tab 4: Internal ── */}
          {activeTab === 4 && (
            <div className="space-y-5">
              {/* Common mistakes */}
              <div className="card p-5">
                <SectionTitle>Common Mistakes to Avoid</SectionTitle>
                <div className="space-y-2">
                  {mistakes.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-red-400 font-bold text-sm w-4 shrink-0 text-center">✕</span>
                      <input
                        className="input text-sm flex-1"
                        value={m}
                        onChange={e => setMistake(i, e.target.value)}
                        placeholder="Describe a common mistake..."
                      />
                      <button
                        onClick={() => removeMistake(i)}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addMistake}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-1"
                  >
                    <Plus className="w-4 h-4" /> Add mistake
                  </button>
                </div>
              </div>

              {/* Agent tips */}
              <div className="card p-5 bg-slate-50 border-slate-200">
                <SectionTitle muted>Agent Tips — Internal only</SectionTitle>
                <RichTextEditor
                  value={form.agentTips}
                  onChange={setRich('agentTips')}
                  placeholder="Internal notes and tips for DC agents..."
                  minHeight={150}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════
          UNIVERSITY TABS
      ═══════════════════════════════════ */}
      {!isDestination && (
        <>
          {/* ── Tab 0: Basic ── */}
          {activeTab === 0 && (
            <div className="card p-5 space-y-4">
              <div>
                <Label>Destination</Label>
                <select className="input" value={form.destinationRef} onChange={handleDestPick}>
                  <option value="">Select destination...</option>
                  {destinations.map(d => (
                    <option key={d._id} value={d._id}>{d.flag} {d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>University Name *</Label>
                  <input
                    className="input"
                    value={form.universityName || form.title}
                    onChange={e => mutateForm(p => ({ ...p, universityName: e.target.value, title: e.target.value }))}
                    placeholder="Vilnius University"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <input className="input" value={form.city} onChange={set('city')} placeholder="Vilnius" />
                </div>
                <div>
                  <Label note="Optional">Processing Time</Label>
                  <input className="input" value={form.processingTime} onChange={set('processingTime')} placeholder="e.g. 4–6 weeks" />
                </div>
                <div>
                  <Label note="Optional">Admissions Email</Label>
                  <input className="input" type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="admissions@uni.edu" />
                </div>
                <div>
                  <Label note="Optional">Contact Person</Label>
                  <input className="input" value={form.contactPerson} onChange={set('contactPerson')} placeholder="Name of contact" />
                </div>
                <div className="col-span-2 flex items-center gap-3 pt-1">
                  <input
                    id="partner"
                    type="checkbox"
                    checked={form.isPartner}
                    onChange={e => mutateForm(p => ({ ...p, isPartner: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600"
                  />
                  <label htmlFor="partner" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Partner university
                  </label>
                </div>
              </div>
              <StudentFacingFields form={form} mutateForm={mutateForm} stageNames={stageNames} />
            </div>
          )}

          {/* ── Tab 1: Programs & Intakes ── */}
          {activeTab === 1 && (
            <div className="space-y-5">
              {/* Programs */}
              <div className="card p-5">
                <SectionTitle>Programs Offered</SectionTitle>
                <div className="space-y-3">
                  {programs.map((p, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Program {i + 1}</span>
                        <button onClick={() => removeProgram(i)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          className="input text-sm bg-white col-span-3 sm:col-span-1"
                          value={p.name}
                          onChange={e => setProgram(i, 'name', e.target.value)}
                          placeholder="Program name"
                        />
                        <input
                          className="input text-sm bg-white"
                          value={p.language}
                          onChange={e => setProgram(i, 'language', e.target.value)}
                          placeholder="Language"
                        />
                        <input
                          className="input text-sm bg-white"
                          type="number"
                          value={p.tuitionFee}
                          onChange={e => setProgram(i, 'tuitionFee', e.target.value)}
                          placeholder="Tuition €/yr"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addProgram}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="w-4 h-4" /> Add program
                  </button>
                </div>
              </div>

              {/* Intake periods */}
              <div className="card p-5">
                <SectionTitle>Intake Periods</SectionTitle>
                <div className="space-y-3">
                  {intakes.map((intake, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Intake {i + 1}</span>
                        <button onClick={() => removeIntake(i)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Semester</p>
                          <input
                            className="input text-sm bg-white"
                            value={intake.semester}
                            onChange={e => setIntake(i, 'semester', e.target.value)}
                            placeholder="e.g. Fall 2025"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Application Deadline</p>
                          <input
                            className="input text-sm bg-white"
                            type="date"
                            value={intake.applicationDeadline}
                            onChange={e => setIntake(i, 'applicationDeadline', e.target.value)}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Start Date</p>
                          <input
                            className="input text-sm bg-white"
                            type="date"
                            value={intake.startDate}
                            onChange={e => setIntake(i, 'startDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                        <input
                          className="input text-sm bg-white"
                          value={intake.notes}
                          onChange={e => setIntake(i, 'notes', e.target.value)}
                          placeholder="Any additional info..."
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addIntake}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="w-4 h-4" /> Add intake period
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Requirements ── */}
          {activeTab === 2 && (
            <div className="space-y-5">
              <div className="card p-5 space-y-3">
                <SectionTitle>Application Requirements</SectionTitle>
                <RichTextEditor
                  value={form.applicationRequirements}
                  onChange={setRich('applicationRequirements')}
                  placeholder="Academic level, language certificates, documents needed to apply..."
                  minHeight={150}
                />
              </div>
              <div className="card p-5 space-y-3">
                <SectionTitle>Admission Profile</SectionTitle>
                <RichTextEditor
                  value={form.admissionProfile}
                  onChange={setRich('admissionProfile')}
                  placeholder="What kind of student typically gets accepted — grades, background, language level..."
                  minHeight={120}
                />
              </div>
            </div>
          )}

          {/* ── Tab 3: Internal ── */}
          {activeTab === 3 && (
            <div className="card p-5 space-y-3 bg-slate-50 border-slate-200">
              <SectionTitle muted>Internal Notes — Agents only</SectionTitle>
              <RichTextEditor
                value={form.internalNotes}
                onChange={setRich('internalNotes')}
                placeholder="Internal tips, contacts, quirks about this university..."
                minHeight={200}
              />
            </div>
          )}
        </>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-60 right-0 z-10 bg-white border-t border-gray-100 px-8 py-3 flex items-center justify-between">
        <div>
          {isDirty && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary text-sm">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
