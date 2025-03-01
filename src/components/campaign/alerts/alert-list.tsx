import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { alertApi, type CampaignAlert } from '../../../lib/alert-api';
import { Button } from '../../ui/button';

interface AlertListProps {
  campaignId?: string;
  onDismiss?: () => void;
}

export function AlertList({ campaignId, onDismiss }: AlertListProps) {
  const [alerts, setAlerts] = useState<CampaignAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [campaignId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alertApi.listAlerts(campaignId);
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      setDismissing(alertId);
      setError(null);
      await alertApi.dismissAlert(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      onDismiss?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
      console.error('Error dismissing alert:', err);
    } finally {
      setDismissing(null);
    }
  };

  const getAlertIcon = (type: CampaignAlert['type']) => {
    switch (type) {
      case 'PERFORMANCE':
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case 'BUDGET':
        return <DollarSign className="h-5 w-5 text-red-500" />;
      case 'CONVERSION':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Bell className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          No active alerts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border ${
            alert.type === 'PERFORMANCE' ? 'border-yellow-200 bg-yellow-50' :
            alert.type === 'BUDGET' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getAlertIcon(alert.type)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {alert.message}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              disabled={dismissing === alert.id}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className={`h-4 w-4 ${dismissing === alert.id ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}