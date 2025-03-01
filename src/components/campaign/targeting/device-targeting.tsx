import { Smartphone, Laptop, Tablet } from 'lucide-react';

interface DeviceBidAdjustment {
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET';
  bidModifier: number;
}

interface DeviceTargetingProps {
  adjustments: DeviceBidAdjustment[];
  onChange: (adjustments: DeviceBidAdjustment[]) => void;
  disabled?: boolean;
}

export function DeviceTargeting({ adjustments, onChange, disabled }: DeviceTargetingProps) {
  const updateBidModifier = (deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET', bidModifier: number) => {
    const newAdjustments = adjustments.map(adj =>
      adj.deviceType === deviceType ? { ...adj, bidModifier } : adj
    );
    onChange(newAdjustments);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { type: 'MOBILE' as const, icon: Smartphone, label: 'Mobile' },
          { type: 'DESKTOP' as const, icon: Laptop, label: 'Desktop' },
          { type: 'TABLET' as const, icon: Tablet, label: 'Tablet' },
        ].map(({ type, icon: Icon, label }) => {
          const adjustment = adjustments.find(adj => adj.deviceType === type);
          return (
            <div
              key={type}
              className="p-4 rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900">{label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={adjustment?.bidModifier || 0}
                  onChange={(e) => updateBidModifier(type, Number(e.target.value))}
                  min="-90"
                  max="900"
                  step="1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={disabled}
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {adjustment?.bidModifier === 0
                  ? 'No adjustment'
                  : adjustment?.bidModifier && adjustment.bidModifier > 0
                  ? `Increase bids by ${adjustment.bidModifier}%`
                  : `Decrease bids by ${Math.abs(adjustment?.bidModifier || 0)}%`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}