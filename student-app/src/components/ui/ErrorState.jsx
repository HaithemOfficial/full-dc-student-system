export default function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="font-semibold text-gray-700">Something went wrong</p>
      <p className="text-sm text-gray-400 mt-1">Please check your connection and try again</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 bg-brand-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl active:opacity-80 transition-opacity"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
