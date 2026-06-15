import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import api from '../utils/api';

const FALLBACK_SLIDES = [
  {
    emoji: '✨',
    title: 'Welcome, {firstName}!',
    body: 'Your El Nadjah dashboard is ready. Everything you need for your study-abroad journey is right here.',
  },
  {
    emoji: '📍',
    title: 'Track your journey',
    body: "You're applying to {destinationName}. Follow your current stage and see exactly where you stand.",
  },
  {
    emoji: '📄',
    title: 'Documents & updates',
    body: "Your agent keeps your document statuses up to date. You'll always know what's needed and what's approved.",
  },
  {
    emoji: '🤝',
    title: 'Your agent',
    body: 'Your dedicated agent is here to guide you every step of the way. You can reach them from your home screen anytime.',
  },
];

function applyVars(str, student) {
  return str
    .replace(/\{firstName\}/g, student?.firstName || '')
    .replace(/\{destinationName\}/g, student?.destinationName || 'your destination');
}

export default function Onboarding({ student, onComplete }) {
  const [slides, setSlides] = useState([]);
  const [step, setStep]     = useState(0);

  useEffect(() => {
    api.get('/student/me/onboarding-slides')
      .then(r => setSlides(r.data?.length ? r.data : FALLBACK_SLIDES))
      .catch(() => setSlides(FALLBACK_SLIDES));
  }, []);

  if (slides.length === 0) return null;

  const current = slides[step];
  const isLast  = step === slides.length - 1;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-7 py-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5 text-4xl">
            {current.emoji || '✨'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {applyVars(current.title, student)}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {applyVars(current.body, student)}
          </p>
        </div>

        {/* Actions */}
        <div className="px-7 pb-7 space-y-2">
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-600 text-white font-semibold active:bg-brand-700 transition-colors"
          >
            {isLast ? "Let's go!" : 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
          {!isLast && (
            <button
              onClick={onComplete}
              className="w-full py-2.5 text-sm text-gray-400 active:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
