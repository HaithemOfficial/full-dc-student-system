import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORIES = [
  { key: 'travel',        emoji: '✈️',  label: 'Travel & Packing' },
  { key: 'arrival',       emoji: '🏠',  label: 'After Arrival' },
  { key: 'documents',     emoji: '📄',  label: 'Documents' },
  { key: 'accommodation', emoji: '🏢',  label: 'Accommodation' },
  { key: 'finance',       emoji: '🏦',  label: 'Finance' },
  { key: 'general',       emoji: '🔧',  label: 'General' },
  { key: '',              emoji: '📚',  label: 'Other' },
];

function estimateReadTime(text) {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const el = document.getElementById('guide-content-scroll');
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setPct(max > 0 ? Math.round((scrollTop / max) * 100) : 100);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="h-1 bg-gray-100 w-full">
      <div className="h-full bg-brand-500 transition-all duration-100" style={{ width: `${pct}%` }} />
    </div>
  );
}

function GuideDetail({ guide, onBack }) {
  return (
    <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col">
      <ReadingProgress />
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="font-bold text-gray-900 text-sm flex-1 truncate">{guide.title}</h2>
      </div>
      <div id="guide-content-scroll" className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-lg mx-auto pb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{guide.title}</h1>
          {guide.overview && (
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: guide.overview }}
            />
          )}
          {guide.steps?.length > 0 && (
            <div className="mt-6 space-y-3">
              {guide.steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                    {s.description && <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{s.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuidesHub() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');
  const [openCategories, setOpenCategories] = useState({});
  const [activeGuide, setActiveGuide] = useState(null);

  const toggleCat = (key) => setOpenCategories(p => ({ ...p, [key]: !p[key] }));

  const shell = (children) => (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Guides</h1>
        <p className="text-xs text-gray-400 mt-0.5">Practical guides for your journey</p>
      </div>
      {children}
    </div>
  );

  if (loading) return shell(<SkeletonList count={4} />);
  if (error)   return shell(<ErrorState onRetry={refetch} />);

  const guides = content?.studentGuides || [];

  if (guides.length === 0) return shell(
    <EmptyState icon="📚" title="No guides yet" subtitle="Your agent will add practical guides here soon." />
  );

  // Group by category
  const byCategory = {};
  for (const g of guides) {
    const cat = g.guideCategory || '';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(g);
  }

  const visibleCategories = CATEGORIES.filter(c => byCategory[c.key]?.length > 0);

  return (
    <>
      {shell(
        <div className="space-y-3">
          {visibleCategories.map(cat => {
            const items = byCategory[cat.key] || [];
            const isOpen = openCategories[cat.key] !== false; // open by default
            return (
              <div key={cat.key} className="card overflow-hidden">
                <button
                  onClick={() => toggleCat(cat.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="flex-1 text-sm font-semibold text-gray-900 text-left">{cat.label}</span>
                  <span className="text-xs text-gray-400 mr-1">{items.length}</span>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {items.map(g => {
                      const readTime = estimateReadTime(g.overview);
                      if (g.locked) return (
                        <button
                          key={g._id}
                          onClick={() => toast(g.lockedReason || 'Not available yet.', { icon: '🔒' })}
                          className="w-full flex items-center gap-3 px-4 py-3.5 opacity-50 text-left"
                        >
                          <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-400 truncate">{g.title}</p>
                            <p className="text-xs text-gray-300 mt-0.5">{g.lockedReason}</p>
                          </div>
                        </button>
                      );
                      return (
                        <button
                          key={g._id}
                          onClick={() => setActiveGuide(g)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{g.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{readTime} min read</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {activeGuide && <GuideDetail guide={activeGuide} onBack={() => setActiveGuide(null)} />}
    </>
  );
}
