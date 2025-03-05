import React from 'react';
import { TrendDirection } from '../../types/dashboard-types';

interface KPICardProps {
  title: string;
  value: number;
  unit?: string;
  trend?: TrendDirection;
  comparison?: number;
  format?: 'number' | 'percentage' | 'time' | 'currency';
  threshold?: number;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * KPI Card Component
 * 
 * Displays a key performance indicator with trend and comparison information
 */
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  trend,
  comparison,
  format = 'number',
  threshold,
  loading = false,
  onClick,
}) => {
  // Format value based on format type
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`;
      case 'time':
        return formatTime(val);
      case 'currency':
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  // Format time values (milliseconds to readable format)
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  // Get trend arrow and color
  const getTrendIndicator = (): { arrow: string; colorClass: string } => {
    if (!trend) return { arrow: '–', colorClass: 'text-gray-500' };
    
    switch (trend) {
      case 'up':
        return { arrow: '↑', colorClass: 'text-green-500' };
      case 'down':
        return { arrow: '↓', colorClass: 'text-red-500' };
      case 'neutral':
      default:
        return { arrow: '–', colorClass: 'text-gray-500' };
    }
  };

  // Calculate change percentage if comparison is provided
  const getComparisonText = (): string => {
    if (comparison === undefined) return '';
    const diff = Math.abs(value - comparison);
    const percent = comparison !== 0 ? (diff / comparison) * 100 : 0;
    return `${percent.toFixed(1)}% vs previous`;
  };

  // Determine indicator color based on threshold
  const getValueColor = (): string => {
    if (threshold === undefined) return 'text-blue-700';
    if (format === 'percentage') {
      if (value * 100 >= threshold) return 'text-green-600';
      if (value * 100 >= threshold * 0.8) return 'text-amber-500';
      return 'text-red-600';
    } else {
      if (value >= threshold) return 'text-green-600';
      if (value >= threshold * 0.8) return 'text-amber-500';
      return 'text-red-600';
    }
  };

  const trendIndicator = getTrendIndicator();
  const valueColor = getValueColor();
  const comparisonText = getComparisonText();

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {trend && (
          <span className={`flex items-center ${trendIndicator.colorClass}`}>
            {trendIndicator.arrow}
          </span>
        )}
      </div>
      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline">
            <p className={`text-2xl font-semibold ${valueColor}`}>
              {formatValue(value)}
              {unit && !['percentage', 'currency'].includes(format) && (
                <span className="text-sm ml-1">{unit}</span>
              )}
            </p>
          </div>
          {comparison !== undefined && (
            <p className="text-xs mt-1 text-gray-500">{comparisonText}</p>
          )}
        </>
      )}
    </div>
  );
};

export default KPICard;
