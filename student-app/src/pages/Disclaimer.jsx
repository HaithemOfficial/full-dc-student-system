import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';

export default function Disclaimer() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');

  useEffect(() => {
    api.get('/settings/public')
      .then(r => {
        const d = r.data?.disclaimer;
        if (d?.title) setTitle(d.title);
        if (d?.body)  setBody(d.body);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="px-4 pt-6 pb-12 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{body}</p>
      </div>

      <p className="text-center text-xs text-gray-300 mt-6">El Nadjah Agency</p>
    </div>
  );
}
