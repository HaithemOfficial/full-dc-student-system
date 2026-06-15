import { useState } from 'react';
import { X, Youtube, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/);
  return m ? m[1] : null;
}

function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function YouTubeEmbed({ url }) {
  const id = getYouTubeId(url);
  if (!id) return <div className="aspect-video bg-gray-900 flex items-center justify-center text-white text-sm">Invalid URL</div>;
  return (
    <div className="aspect-video w-full bg-black">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function TikTokEmbed({ url }) {
  return (
    <div className="w-full min-h-[500px] flex items-center justify-center bg-black">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={url.split('/video/')[1]?.split('?')[0]}
        style={{ maxWidth: '100%', minWidth: '325px' }}
      >
        <section />
      </blockquote>
      <script async src="https://www.tiktok.com/embed.js" />
    </div>
  );
}

function VideoModal({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{video.title}</p>
          {video.description && <p className="text-white/60 text-xs mt-0.5 truncate">{video.description}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {video.platform === 'youtube'
          ? <YouTubeEmbed url={video.url} />
          : <TikTokEmbed url={video.url} />
        }
      </div>
    </div>
  );
}

export default function VideoExamples() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');
  const [activeVideo, setActiveVideo] = useState(null);

  const shell = (children) => (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Video Examples</h1>
      {children}
    </div>
  );

  if (loading) return shell(<SkeletonList count={4} />);
  if (error)   return shell(<ErrorState onRetry={refetch} />);

  const videos = content?.interviewVideos || [];

  if (videos.length === 0) return shell(
    <EmptyState icon="🎥" title="Video examples coming soon" subtitle="Your agent will add interview example videos here." />
  );

  return (
    <>
      {shell(
        <div className="grid grid-cols-2 gap-3">
          {videos.map(v => {
            if (v.locked) return (
              <button
                key={v._id}
                onClick={() => toast(v.lockedReason || 'Not available at your current stage.', { icon: '🔒' })}
                className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video flex flex-col items-center justify-center gap-1 opacity-60"
              >
                <Lock className="w-5 h-5 text-gray-400" />
                <p className="text-xs text-gray-500 px-2 text-center leading-tight">{v.lockedReason || 'Locked'}</p>
              </button>
            );

            const thumb = v.platform === 'youtube' ? getYouTubeThumbnail(v.url) : null;
            return (
              <button
                key={v._id}
                onClick={() => setActiveVideo(v)}
                className="relative rounded-2xl overflow-hidden bg-gray-900 active:opacity-80 transition-opacity text-left"
              >
                {thumb ? (
                  <img src={thumb} alt={v.title} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <span className="text-3xl">📱</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    {v.platform === 'youtube'
                      ? <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">YT</span>
                      : <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">TK</span>
                    }
                  </div>
                  <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{v.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </>
  );
}
