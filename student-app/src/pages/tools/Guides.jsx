import { useState } from 'react';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

const TYPE_LABELS = {
  destination_overview: 'Destination Overview',
  student_tip: 'Student Tip',
  university_info: 'University Info',
};

export default function Guides() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');
  const [selected, setSelected] = useState(null);

  const articles = content
    ? [...(content.guides || []), ...(content.tips || [])]
    : [];

  const tapLocked = (reason) => toast(reason || 'This guide is not available at your current stage.', { icon: '🔒' });

  if (selected) {
    return <ArticleReader article={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Guides & Tips</h1>

      {loading && <SkeletonList count={3} />}
      {!loading && error && <ErrorState onRetry={refetch} />}

      {!loading && !error && articles.length === 0 && (
        <EmptyState
          icon="📖"
          title="No guides yet"
          subtitle="Your DC agent will add destination guides and tips here"
        />
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="space-y-3">
          {articles.map(article => {
            if (article.locked) {
              return (
                <button
                  key={article._id}
                  onClick={() => tapLocked(article.lockedReason)}
                  className="w-full text-start bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-400 text-sm leading-snug">{article.title}</p>
                      <p className="text-xs text-gray-300 mt-1">{TYPE_LABELS[article.articleType] || article.articleType}</p>
                    </div>
                  </div>
                </button>
              );
            }
            return (
              <button
                key={article._id}
                onClick={() => setSelected(article)}
                className="w-full text-start bg-white rounded-2xl border border-gray-100 p-4 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    {article.articleType === 'student_tip' ? '💡' : '🌍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{article.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{TYPE_LABELS[article.articleType] || article.articleType}</p>
                    {article.overview && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed"
                         dangerouslySetInnerHTML={{ __html: article.overview.replace(/<[^>]+>/g, '').slice(0, 120) + '...' }}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArticleReader({ article, onBack }) {
  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 leading-snug">{article.title}</h1>
      </div>

      {article.overview && (
        <div className="prose prose-sm text-gray-700 max-w-none mb-5" dangerouslySetInnerHTML={{ __html: article.overview }} />
      )}

      {article.steps && article.steps.length > 0 && (
        <div className="space-y-3 mb-5">
          {article.steps.map((step, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                  {step.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {article.faqs && article.faqs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">FAQ</p>
          {article.faqs.map((faq, i) => <FaqItem key={i} faq={faq} />)}
        </div>
      )}
    </div>
  );
}

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full px-4 py-3.5 text-start flex items-center gap-3">
        <span className="flex-1 text-sm font-medium text-gray-800">{faq.question}</span>
        <span className="text-gray-400">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="h-px bg-gray-50 mb-3" />
          <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}
