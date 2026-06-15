import { useState } from 'react';
import { CheckSquare, Square, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

const TYPE_LABELS = {
  visa_checklist: { label: 'Visa Checklist', emoji: '📋' },
  after_arrival: { label: 'After Arrival', emoji: '✈️' },
};

export default function Checklists() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');
  const [checked, setChecked] = useState({});

  const articles = content?.checklists || [];

  const toggleItem = (articleId, itemIdx) => {
    const key = `${articleId}-${itemIdx}`;
    setChecked(p => ({ ...p, [key]: !p[key] }));
  };

  const tapLocked = (reason) => toast(reason || 'This checklist is not available at your current stage.', { icon: '🔒' });

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Checklists</h1>
        <p className="text-xs text-gray-400 mt-0.5">Tap items to track your own progress</p>
      </div>

      {loading && <SkeletonList count={3} />}
      {!loading && error && <ErrorState onRetry={refetch} />}

      {!loading && !error && articles.length === 0 && (
        <EmptyState
          icon="📋"
          title="No checklists yet"
          subtitle="Your DC agent will add visa and arrival checklists here"
        />
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="space-y-4">
          {articles.map(article => {
            if (article.locked) {
              const meta = TYPE_LABELS[article.articleType] || { label: article.articleType, emoji: '📄' };
              return (
                <button
                  key={article._id}
                  onClick={() => tapLocked(article.lockedReason)}
                  className="w-full text-start bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-400 text-sm">{article.title}</p>
                      <p className="text-xs text-gray-300">{meta.label}</p>
                    </div>
                  </div>
                </button>
              );
            }

            const meta = TYPE_LABELS[article.articleType] || { label: article.articleType, emoji: '📄' };
            const items = article.steps || [];
            const checkedCount = items.filter((_, i) => checked[`${article._id}-${i}`]).length;

            return (
              <div key={article._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{article.title}</p>
                      <p className="text-xs text-gray-400">{meta.label}</p>
                    </div>
                    {items.length > 0 && <span className="text-xs text-gray-400">{checkedCount}/{items.length}</span>}
                  </div>
                  {items.length > 0 && (
                    <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {items.map((step, i) => {
                      const key = `${article._id}-${i}`;
                      const isChecked = checked[key] || false;
                      return (
                        <button
                          key={i}
                          onClick={() => toggleItem(article._id, i)}
                          className="w-full flex items-start gap-3 px-4 py-3.5 text-start active:bg-gray-50 transition-colors"
                        >
                          {isChecked
                            ? <CheckSquare className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                            : <Square className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {step.title}
                            </p>
                            {step.description && !isChecked && (
                              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.description}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {items.length === 0 && article.overview && (
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-600 leading-relaxed"
                       dangerouslySetInnerHTML={{ __html: article.overview.replace(/<[^>]+>/g, '') }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
