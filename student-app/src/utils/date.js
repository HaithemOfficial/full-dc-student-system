import { format, formatDistanceToNow, isToday, isTomorrow, isPast, differenceInCalendarDays } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'd MMM yyyy');

export const formatDateTime = (date) => format(new Date(date), 'd MMM yyyy · HH:mm');

export const daysFromNow = (date) => differenceInCalendarDays(new Date(date), new Date());

export const deadlineLabel = (date) => {
  const d = new Date(date);
  const days = differenceInCalendarDays(d, new Date());
  if (isPast(d) && days < 0) return { text: 'OVERDUE', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  if (days === 0) return { text: 'TODAY', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  if (days === 1) return { text: 'tomorrow', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
  if (days <= 3) return { text: `in ${days} days`, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
  if (days <= 7) return { text: `in ${days} days`, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' };
  return { text: `in ${days} days`, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
};

export const groupByTime = (items, dateField = 'createdAt') => {
  const now = new Date();
  const groups = { Today: [], Yesterday: [], 'This Week': [], Older: [] };
  items.forEach(item => {
    const d = new Date(item[dateField]);
    const days = differenceInCalendarDays(now, d);
    if (days === 0) groups.Today.push(item);
    else if (days === 1) groups.Yesterday.push(item);
    else if (days <= 7) groups['This Week'].push(item);
    else groups.Older.push(item);
  });
  return groups;
};

export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });
