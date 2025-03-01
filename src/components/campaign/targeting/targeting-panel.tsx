import { useState } from 'react';
import { MapPin, Smartphone, Clock, Users } from 'lucide-react';
import { LocationTargeting } from './location-targeting';
import { DeviceTargeting } from './device-targeting';
import { AdSchedule } from './ad-schedule';
import { AudienceTargeting } from './audience-targeting';

interface TargetingPanelProps {
  campaignId: string;
  onSave: () => void;
  disabled?: boolean;
}

type TabType = 'location' | 'device' | 'schedule' | 'audience';

const TABS: { id: TabType; label: string; icon: typeof MapPin }[] = [
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'device', label: 'Device', icon: Smartphone },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'audience', label: 'Audience', icon: Users },
];

export function TargetingPanel({ campaignId, onSave, disabled }: TargetingPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('location');

  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      <div className="flex border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-4 px-4 text-sm font-medium text-center focus:outline-none ${
              activeTab === id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="mx-auto h-5 w-5 mb-1" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'location' && (
          <LocationTargeting
            locations={[]}
            onChange={() => {}}
            disabled={disabled}
          />
        )}
        {activeTab === 'device' && (
          <DeviceTargeting
            adjustments={[
              { deviceType: 'MOBILE', bidModifier: 0 },
              { deviceType: 'DESKTOP', bidModifier: 0 },
              { deviceType: 'TABLET', bidModifier: 0 },
            ]}
            onChange={() => {}}
            disabled={disabled}
          />
        )}
        {activeTab === 'schedule' && (
          <AdSchedule
            schedule={[]}
            onChange={() => {}}
            disabled={disabled}
          />
        )}
        {activeTab === 'audience' && (
          <AudienceTargeting
            audiences={[]}
            onChange={() => {}}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}