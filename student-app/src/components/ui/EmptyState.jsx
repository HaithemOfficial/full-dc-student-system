export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <p className="font-semibold text-gray-700 text-base">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-[260px]">{subtitle}</p>}
    </div>
  );
}
