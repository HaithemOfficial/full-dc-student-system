import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect phone number or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Top brand bar */}
      <div className="bg-brand-600 pt-safe-top pb-10 px-6 flex flex-col items-center justify-center gap-3" style={{ paddingTop: `calc(env(safe-area-inset-top) + 48px)` }}>
        <div className="w-16 h-16 bg-white rounded-2xl shadow flex items-center justify-center">
          <img src="/icon.png" alt="El Nadjah" className="w-11 h-11 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-white text-xl font-bold">El Nadjah</h1>
          <p className="text-brand-200 text-sm mt-0.5">Your study-abroad journey</p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-6 pt-8 pb-10 flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-400 mb-8">Log in to track your application</p>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
            <input
              type="tel"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="e.g. 0555 123 456"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all pr-12"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute inset-e-3 inset-y-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
                style={{ right: '12px' }}
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white font-semibold py-4 rounded-xl text-base active:opacity-80 transition-opacity disabled:opacity-60 mt-2"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          Don't have access? Contact your DC agent to set up your account.
        </p>
      </div>
    </div>
  );
}
