import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';

export const formatDate = (date) => date ? format(new Date(date), 'dd MMM yyyy') : '—';
export const formatDateTime = (date) => date ? format(new Date(date), 'dd MMM yyyy, HH:mm') : '—';
export const timeAgo = (date) => date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—';
export const isExpired = (date) => date ? isPast(new Date(date)) : false;
export const isExpiringSoon = (date, days = 7) =>
  date ? isWithinInterval(new Date(date), { start: new Date(), end: addDays(new Date(), days) }) : false;

export const DOCUMENT_STATUSES = [
  { value: 'not_requested', label: 'Not Requested', color: 'bg-gray-100 text-gray-600' },
  { value: 'requested', label: 'Requested', color: 'bg-blue-100 text-blue-700' },
  { value: 'received', label: 'Received', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
  { value: 'sent_for_translation', label: 'Sent for Translation', color: 'bg-purple-100 text-purple-700' },
  { value: 'translated', label: 'Translated', color: 'bg-teal-100 text-teal-700' },
  { value: 'sent_for_legalization', label: 'Sent for Legalization', color: 'bg-orange-100 text-orange-700' },
  { value: 'legalized', label: 'Legalized', color: 'bg-lime-100 text-lime-700' },
  { value: 'ready', label: 'Ready', color: 'bg-emerald-100 text-emerald-700' },
];

export const getDocumentStatusInfo = (value) =>
  DOCUMENT_STATUSES.find(s => s.value === value) || DOCUMENT_STATUSES[0];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'ccp', label: 'CCP' },
  { value: 'other', label: 'Other' },
];

export const CHECKLIST_TYPES = {
  action: { label: 'Action', color: 'bg-blue-100 text-blue-700', icon: '✓' },
  verification: { label: 'Verification', color: 'bg-yellow-100 text-yellow-700', icon: '🔍' },
  student_notification: { label: 'Student Notification', color: 'bg-purple-100 text-purple-700', icon: '📢' },
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-DZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount || 0) + ' DZD';
