import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const POPUP_KEY = 'referralPopupSeen';

export default function ReferralPopup({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const copy = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const learnMore = () => {
    onClose();
    navigate('/referral');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl px-6 pt-5 pb-8 space-y-5 animate-slide-up">
        {/* Handle + close */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div className="flex-1" />
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900">{data?.settings?.popupTitle || 'Share & Save Together 🎁'}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{data?.settings?.popupMessage || ''}</p>
        </div>

        {/* Code box */}
        {data?.referralCode && (
          <div>
            <p className="text-xs font-medium text-gray-400 text-center mb-2">Your referral code</p>
            <button
              onClick={copy}
              className="w-full flex items-center justify-between bg-gray-100 rounded-2xl px-5 py-4 active:bg-gray-200 transition-colors"
            >
              <span className="font-mono text-2xl font-bold text-gray-900 tracking-wider">{data.referralCode}</span>
              <span className={`text-sm font-semibold transition-colors ${copied ? 'text-green-500' : 'text-brand-600'}`}>
                {copied ? 'Copied! ✓' : '📋 Copy'}
              </span>
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Tap to copy</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-1">
          <button
            onClick={learnMore}
            className="w-full py-3.5 bg-brand-600 text-white font-semibold rounded-2xl text-sm active:bg-brand-700 transition-colors"
          >
            Learn More
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-gray-400 font-medium"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowReferralPopup() {
  return !localStorage.getItem(POPUP_KEY);
}

export function markReferralPopupSeen() {
  localStorage.setItem(POPUP_KEY, '1');
}
