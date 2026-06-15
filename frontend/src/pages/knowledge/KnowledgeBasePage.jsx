import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, BookOpen, Globe, Building2, Clock, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

function ArticleCard({ article }) {
  const isDestination = article.type === 'destination';
  return (
    <Link
      to={`/kb/${article._id}`}
      className="card p-5 hover:shadow-md transition-all hover:border-brand-100 flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {isDestination ? (
            <span className="text-2xl leading-none">{article.flag || '🌍'}</span>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-brand-500" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors leading-tight">
              {article.title}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDestination
                ? `${article.countryCode || ''} · Destination guide`
                : `${article.city || ''} · ${article.destinationName || 'University'}`
              }
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`badge text-xs ${
            article.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {article.status === 'published' ? 'Published' : 'Draft'}
          </span>
          {!isDestination && article.isPartner && (
            <span className="badge bg-brand-100 text-brand-700 text-xs">Partner</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          Updated {formatDate(article.updatedAt)}
          {article.lastUpdatedByName && ` by ${article.lastUpdatedByName}`}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors" />
      </div>
    </Link>
  );
}

export default function KnowledgeBasePage() {
  const { isFounder } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [destFilter, setDestFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/kb'),
      api.get('/destinations'),
    ]).then(([kbRes, destRes]) => {
      setArticles(kbRes.data);
      setDestinations(destRes.data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      if (tab === 'destinations' && a.type !== 'destination') return false;
      if (tab === 'universities' && a.type !== 'university') return false;
      if (destFilter && a.destinationRef !== destFilter && String(a.destinationRef) !== destFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.title?.toLowerCase().includes(q) ||
          a.destinationName?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [articles, tab, destFilter, search]);

  const destArticles = filtered.filter(a => a.type === 'destination');
  const uniArticles = filtered.filter(a => a.type === 'university');

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl font-bold text-gray-900">Knowledge Base</h2>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">One source of truth for destinations and universities</p>
        </div>
        {isFounder && (
          <button onClick={() => navigate('/kb/new')} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Article
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {tab === 'universities' && (
          <select
            className="input text-sm w-48"
            value={destFilter}
            onChange={e => setDestFilter(e.target.value)}
          >
            <option value="">All destinations</option>
            {destinations.map(d => (
              <option key={d._id} value={d._id}>{d.flag} {d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { id: 'all', label: 'All', icon: BookOpen },
          { id: 'destinations', label: 'Destinations', icon: Globe },
          { id: 'universities', label: 'Universities', icon: Building2 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setDestFilter(''); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">
            {search ? 'No articles match your search' : 'No articles yet'}
          </p>
          {isFounder && !search && (
            <button onClick={() => navigate('/kb/new')} className="btn-primary text-sm mt-4 mx-auto">
              <Plus className="w-4 h-4" /> Create first article
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Destination articles */}
          {(tab === 'all' || tab === 'destinations') && destArticles.length > 0 && (
            <div className="space-y-3">
              {tab === 'all' && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Destinations
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destArticles.map(a => <ArticleCard key={a._id} article={a} />)}
              </div>
            </div>
          )}

          {/* University articles */}
          {(tab === 'all' || tab === 'universities') && uniArticles.length > 0 && (
            <div className="space-y-3">
              {tab === 'all' && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Universities
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniArticles.map(a => <ArticleCard key={a._id} article={a} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
