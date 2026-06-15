import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import api from '../utils/api';

const TOOLS = [
  {
    to:    '/tools/interview-prep',
    emoji: '🎓',
    label: 'Interview Preparation',
    desc:  'Mock questions, video examples & common mistakes',
    from:  'from-brand-500',
    toClr: 'to-indigo-600',
  },
  {
    to:    '/tools/guides',
    emoji: '📚',
    label: 'Guides',
    desc:  'Travel, arrival, documents & more',
    from:  'from-emerald-500',
    toClr: 'to-teal-600',
  },
  {
    to:    '/tools/faq',
    emoji: '❓',
    label: 'FAQ',
    desc:  'Answers to common questions',
    from:  'from-purple-500',
    toClr: 'to-violet-600',
  },
];

export default function Tools() {
  const [links, setLinks]                   = useState([]);
  const [interviewAvailable, setInterview]  = useState(true);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/me/useful-links'),
      api.get('/student/me/interview-prep/check'),
    ]).then(([linksRes, iqRes]) => {
      setLinks(linksRes.data || []);
      setInterview(iqRes.data?.available ?? true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Resources</h1>
      <p className="text-sm text-gray-400 mb-6">Everything you need for your journey</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-3xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {TOOLS.filter(t => t.to !== '/tools/interview-prep' || interviewAvailable).map(({ to, emoji, label, desc, from, toClr }) => (
              <Link
                key={to}
                to={to}
                className={`block rounded-3xl bg-gradient-to-br ${from} ${toClr} overflow-hidden active:opacity-90 transition-opacity shadow-sm`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <span className="text-4xl">{emoji}</span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1.5">{label}</h2>
                  <p className="text-sm text-white/75 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {links.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Useful Links</h2>
              <div className="space-y-2">
                {links.map(link => (
                  <a
                    key={link._id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
                  >
                    <span className="text-2xl w-9 text-center shrink-0">{link.emoji || '🔗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{link.title}</p>
                      {link.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{link.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
