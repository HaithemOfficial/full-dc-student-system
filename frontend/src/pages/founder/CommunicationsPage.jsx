import { useState } from 'react';
import { Bell, Megaphone } from 'lucide-react';
import NotificationsSettingsPage from './NotificationsSettingsPage';
import AnnouncementsPage from '../studentApp/AnnouncementsPage';

const TABS = [
  { id: 'notifications', label: 'Automated Notifications', icon: Bell },
  { id: 'announcements', label: 'Announcements',           icon: Megaphone },
];

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="border-b border-gray-100 px-6 pt-4 shrink-0">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notifications' && <NotificationsSettingsPage />}
        {activeTab === 'announcements'  && (
          <div className="px-6 py-6">
            <AnnouncementsPage />
          </div>
        )}
      </div>
    </div>
  );
}
