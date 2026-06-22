import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function makeWatermarkUrl(phone) {
  try {
    const W = 320, H = 160;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const stamp = (cx, cy) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 7);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText(String(phone), 0, 0);
      ctx.restore();
    };

    const cols = [W * 0.17, W * 0.5, W * 0.83];
    const rows = [H * 0.17, H * 0.5, H * 0.83];
    for (const cy of rows) for (const cx of cols) stamp(cx, cy);

    return canvas.toDataURL();
  } catch {
    return null;
  }
}

export default function ContentGuard({ children }) {
  const { student } = useAuth();
  const [bgUrl, setBgUrl] = useState(null);

  useEffect(() => {
    const phone = student?.phone;
    setBgUrl(phone ? makeWatermarkUrl(phone) : null);
  }, [student?.phone]);

  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  useEffect(() => {
    const s = document.body.style;
    s.userSelect = 'none';
    s.webkitUserSelect = 'none';
    return () => { s.userSelect = ''; s.webkitUserSelect = ''; };
  }, []);

  return (
    <>
      {children}
      {bgUrl && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-40"
          style={{ backgroundImage: `url(${bgUrl})`, backgroundRepeat: 'repeat' }}
        />
      )}
    </>
  );
}
