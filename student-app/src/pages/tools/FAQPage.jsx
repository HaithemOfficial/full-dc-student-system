import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

export default function FAQPage() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');
  const [openItem, setOpenItem] = useState(null);

  const shell = (children) => (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">FAQ</h1>
      {children}
    </div>
  );

  if (loading) return shell(<SkeletonList count={5} />);
  if (error)   return shell(<ErrorState onRetry={refetch} />);

  const faqGrouped = content?.faqs || {};
  const topics = Object.keys(faqGrouped);

  if (topics.length === 0) return shell(
    <EmptyState icon="❓" title="No FAQs available yet" subtitle="Check back soon — your agent will add answers to common questions." />
  );

  const toggleItem = (key) => setOpenItem(p => p === key ? null : key);

  return shell(
    <div className="space-y-3">
      {topics.map(topic => {
        const items = faqGrouped[topic] || [];
        const topicKey = `topic::${topic}`;
        return (
          <div key={topic} className="card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex-1">{topic}</h3>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((item, idx) => {
                const key = `${topicKey}::${idx}`;
                const isOpen = openItem === key;

                if (item.locked) return (
                  <button
                    key={key}
                    onClick={() => toast(item.lockedReason || 'Not available yet.', { icon: '🔒' })}
                    className="w-full flex items-center gap-3 px-4 py-3.5 opacity-50 text-left"
                  >
                    <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                    <span className="text-sm text-gray-400 flex-1 leading-snug">{item.question}</span>
                  </button>
                );

                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full flex items-start gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
                    >
                      <span className={`flex-1 text-sm font-semibold leading-snug ${isOpen ? 'text-brand-700' : 'text-gray-900'}`}>
                        {item.question}
                      </span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-brand-50 bg-brand-50/30">
                        <div
                          className="pt-3 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: item.answer }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
