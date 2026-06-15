import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

export default function Referral() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const { data, loading, error } = useFetch('/student/me/referral');
  const [copied, setCopied] = useState(false);

  const code = data?.referralCode || '';
  const settings = data?.settings || {};
  const discount = settings.referrerDiscount || 5000;

  const shareMessage = code
    ? `Hey! I'm studying abroad with El Nadjah Agency.\nUse my referral code ${code} when you sign up and we both get ${discount.toLocaleString()} DA off our ${settings.discountAppliesTo || 'second installment'}! 🎓\nContact El Nadjah Agency to get started.`
    : '';

  const copy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ text: shareMessage }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!loading && (data?.active === false || !code)) {
    return (
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎁</p>
          <p className="text-gray-400 text-sm">The referral program is not active right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10 max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">Failed to load referral info. Pull to refresh.</p>
        </div>
      ) : (
        <>
          {/* Section 1 — Your Code */}
          <div className="bg-gradient-to-br from-brand-500 to-indigo-600 rounded-3xl p-6 space-y-5 text-white">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎁</span>
              <div>
                <h1 className="text-xl font-bold leading-tight">Your Referral Code</h1>
                <p className="text-sm text-white/75 mt-0.5">Share with friends who want to study abroad</p>
              </div>
            </div>

            {/* Code box */}
            <button
              onClick={copy}
              className="w-full bg-white/20 backdrop-blur rounded-2xl px-5 py-4 flex items-center justify-between active:bg-white/30 transition-colors"
            >
              <span className="font-mono text-2xl font-bold tracking-wider">{code}</span>
              <span className={`text-sm font-semibold transition-colors ${copied ? 'text-green-300' : 'text-white/80'}`}>
                {copied ? 'Copied! ✓' : '📋'}
              </span>
            </button>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copy}
                className="py-3 bg-white/20 rounded-2xl text-sm font-semibold text-white active:bg-white/30 transition-colors"
              >
                {copied ? 'Copied! ✓' : 'Copy Code'}
              </button>
              <button
                onClick={share}
                className="py-3 bg-white rounded-2xl text-sm font-semibold text-brand-700 active:bg-gray-100 transition-colors"
              >
                Share 📤
              </button>
            </div>
          </div>

          {/* Section 2 — How It Works */}
          {settings.howToUseText && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-900">How It Works</h2>
              <div className="space-y-3">
                {settings.howToUseText
                  .split('\n')
                  .map(l => l.trim())
                  .filter(Boolean)
                  .map((line, i) => {
                    const text = line.replace(/^\d+[\.\)]\s*/, '');
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 leading-snug pt-1">{text}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Section 3 — Full Rules */}
          {settings.rulesText && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-3">
              <h2 className="font-bold text-gray-900">Referral Rules</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{settings.rulesText}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
