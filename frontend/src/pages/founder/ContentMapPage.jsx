import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mic, Lock, Eye, Globe, Map } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const RULE_LABELS = {
  always: 'Always',
  from_stage: 'From',
  until_stage: 'Until',
  between_stages: 'Between',
};

const TYPE_LABELS = {
  destination_overview: 'Overview',
  university_info: 'University',
  visa_checklist: 'Checklist',
  after_arrival: 'After Arrival',
  student_tip: 'Tip',
};

function RulePill({ rule }) {
  if (!rule || rule.ruleType === 'always') {
    return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100"><Eye className="w-2.5 h-2.5" /> Always</span>;
  }
  const label = RULE_LABELS[rule.ruleType] || rule.ruleType;
  const detail = rule.ruleType === 'from_stage' ? rule.fromStage
    : rule.ruleType === 'until_stage' ? rule.toStage
    : rule.ruleType === 'between_stages' ? `${rule.fromStage} → ${rule.toStage}`
    : '';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
      <Lock className="w-2.5 h-2.5" /> {label}{detail ? `: ${detail}` : ''}
    </span>
  );
}

function ContentItem({ item, type }) {
  return (
    <div className="flex items-start gap-2 py-2 px-3 bg-white border border-gray-100 rounded-lg">
      <div className={`mt-0.5 shrink-0 ${type === 'article' ? 'text-blue-400' : 'text-purple-400'}`}>
        {type === 'article' ? <BookOpen className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-800 truncate">{item.title || item.name}</span>
          {item.articleType && (
            <span className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded">{TYPE_LABELS[item.articleType] || item.articleType}</span>
          )}
          {type === 'topic' && (
            <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-500 rounded">Topic</span>
          )}
        </div>
        <RulePill rule={item.visibilityRule} />
      </div>
      {type === 'article' && item._id && (
        <Link to={`/kb/${item._id}/edit`} className="text-gray-300 hover:text-brand-500 transition-colors shrink-0 mt-0.5">
          <Globe className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function ContentMapPage() {
  const [destinations, setDestinations] = useState([]);
  const [destId, setDestId] = useState('');
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

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
      api.get(`/kb?destination=${destId}`).catch(() => ({ data: [] })),
      api.get(`/interview-topics?destination=${destId}`).catch(() => ({ data: [] })),
    ])
      .then(([aRes, tRes]) => {
        setArticles(Array.isArray(aRes.data) ? aRes.data.filter(a => a.studentFacing) : []);
        setTopics(tRes.data || []);
      })
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false));
  }, [destId]);

  const dest = destinations.find(d => d._id === destId);
  const allStages = [...(dest?.pipelineStages || [])].sort((a, b) => a.order - b.order);

  // Group content by when it unlocks
  const getStageIndex = (stageName) => allStages.findIndex(s => s.name === stageName);

  const getUnlockStage = (item) => {
    const rule = item.visibilityRule;
    if (!rule || rule.ruleType === 'always') return -1; // always visible
    if (rule.ruleType === 'from_stage' || rule.ruleType === 'between_stages') {
      return getStageIndex(rule.fromStage);
    }
    return -1;
  };

  // Group: "Always available" + per-stage groups
  const groups = {};
  groups['__always'] = [];
  allStages.forEach((_, i) => { groups[i] = []; });

  [...articles.map(a => ({ ...a, _itemType: 'article' })),
    ...topics.map(t => ({ ...t, _itemType: 'topic' }))].forEach(item => {
    const idx = getUnlockStage(item);
    if (idx === -1 || idx >= allStages.length) {
      groups['__always'].push(item);
    } else {
      if (!groups[idx]) groups[idx] = [];
      groups[idx].push(item);
    }
  });

  const totalContent = articles.length + topics.length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Map className="w-6 h-6 text-brand-500" /> Content Map
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Student-facing content grouped by when it unlocks</p>
        </div>
      </div>

      {/* Destination filter */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-600">Destination:</label>
        <select className="input w-48 text-sm" value={destId} onChange={e => setDestId(e.target.value)}>
          {destinations.map(d => <option key={d._id} value={d._id}>{d.flag} {d.name}</option>)}
        </select>
        {!loading && totalContent > 0 && (
          <span className="text-xs text-gray-400">{totalContent} item{totalContent !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && totalContent === 0 && (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-2">🗺️</p>
          <p className="font-semibold text-gray-700">No student-facing content yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add KB articles with "Visible to students" enabled, or create Interview Topics for {dest?.name || 'this destination'}.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Link to="/kb/new" className="btn-primary text-sm">Add KB Article</Link>
            <Link to="/interview-questions" className="btn-secondary text-sm">Manage Topics</Link>
          </div>
        </div>
      )}

      {!loading && totalContent > 0 && (
        <div className="space-y-5">
          {/* Always visible */}
          {groups['__always'].length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-800 text-sm">Always Available</span>
                  <span className="text-xs text-green-600 ml-auto">{groups['__always'].length} item{groups['__always'].length !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-green-600 mt-0.5">Visible from day one, regardless of stage</p>
              </div>
              <div className="p-3 space-y-2">
                {groups['__always'].map((item, i) => (
                  <ContentItem key={item._id || i} item={item} type={item._itemType} />
                ))}
              </div>
            </div>
          )}

          {/* Per-stage groups */}
          {allStages.map((stage, idx) => {
            const items = groups[idx] || [];
            if (items.length === 0) return null;
            return (
              <div key={stage._id} className="card overflow-hidden">
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-indigo-800 text-sm">Unlocks at: {stage.name}</span>
                    <span className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200 ml-1">Stage {idx + 1}</span>
                    <span className="text-xs text-indigo-600 ml-auto">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  {stage.estimatedDays && (
                    <p className="text-xs text-indigo-500 mt-0.5">~{Math.round(stage.estimatedDays / 7)} week{Math.round(stage.estimatedDays / 7) !== 1 ? 's' : ''} into the process</p>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {items.map((item, i) => (
                    <ContentItem key={item._id || i} item={item} type={item._itemType} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
