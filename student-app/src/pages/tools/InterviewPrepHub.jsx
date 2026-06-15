import { Link as RouterLink } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';

export default function InterviewPrepHub() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');

  const shell = (children) => (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Interview Preparation</h1>
        <p className="text-xs text-gray-400 mt-0.5">Everything you need to ace your university interview</p>
      </div>
      {children}
    </div>
  );

  if (loading) return shell(<SkeletonList count={3} />);
  if (error)   return shell(<ErrorState onRetry={refetch} />);

  const topics    = content?.interviewTopics || [];
  const videos    = content?.interviewVideos || [];
  const mistakes  = content?.interviewMistakes || [];

  const questionCount = topics.reduce((n, t) => n + (t.questionCount || 0), 0);
  const videoCount    = videos.length;
  const mistakeCount  = mistakes.length;

  const sections = [
    {
      to:    '/tools/interview-prep/questions',
      emoji: '📝',
      label: 'Mock Questions',
      desc:  'Practice answering real interview questions',
      count: questionCount,
      countLabel: 'questions available',
      from:  'from-brand-500',
      toClr: 'to-indigo-600',
    },
    {
      to:    '/tools/interview-prep/videos',
      emoji: '🎥',
      label: 'Video Examples',
      desc:  'Watch real interview examples',
      count: videoCount,
      countLabel: 'videos available',
      from:  'from-red-500',
      toClr: 'to-orange-500',
      empty: 'Video examples coming soon',
    },
    {
      to:    '/tools/interview-prep/mistakes',
      emoji: '⚠️',
      label: 'Common Mistakes',
      desc:  'Learn what to avoid in your interview',
      count: mistakeCount,
      countLabel: 'mistakes listed',
      from:  'from-amber-500',
      toClr: 'to-yellow-500',
      empty: 'Common mistakes guide coming soon',
    },
  ];

  return shell(
    <div className="space-y-4">
      {sections.map(({ to, emoji, label, desc, count, countLabel, from, toClr }) => (
        <RouterLink
          key={to}
          to={to}
          className={`block rounded-3xl bg-gradient-to-br ${from} ${toClr} overflow-hidden active:opacity-90 transition-opacity shadow-sm`}
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{emoji}</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">{label}</h2>
            <p className="text-sm text-white/75 leading-relaxed mb-3">{desc}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
              {count} {countLabel}
            </span>
          </div>
        </RouterLink>
      ))}
    </div>
  );
}
