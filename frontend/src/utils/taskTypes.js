export const TYPE_META = {
  general:           { label: 'Task',               color: 'bg-gray-100 text-gray-600' },
  interview:         { label: 'Interview',           color: 'bg-purple-100 text-purple-700' },
  vfs_appointment:   { label: 'VFS Appointment',     color: 'bg-blue-100 text-blue-700' },
  document_deadline: { label: 'Document Deadline',   color: 'bg-orange-100 text-orange-700' },
  follow_up:         { label: 'Follow-up',           color: 'bg-green-100 text-green-700' },
  meeting:           { label: 'Meeting',             color: 'bg-indigo-100 text-indigo-700' },
  custom:            { label: 'Custom',              color: 'bg-gray-100 text-gray-700' },
};

export const NOTIFY_OPTIONS = [
  { value: 0,    label: 'At the time' },
  { value: 15,   label: '15 min before' },
  { value: 30,   label: '30 min before' },
  { value: 60,   label: '1 hour before' },
  { value: 120,  label: '2 hours before' },
  { value: 1440, label: '1 day before' },
];
