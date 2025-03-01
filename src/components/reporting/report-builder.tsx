import { useState } from 'react';
import { reportApi, type ReportMetric, type ReportDimension } from '../../lib/report-api';
import { DataGrid } from './data-grid';
import { ChartBuilder } from './chart-builder';
import { MetricSelector } from './metric-selector';
import { DimensionSelector } from './dimension-selector';
import { DateRangePicker } from './date-range-picker';
import { FilterBuilder } from './filter-builder';
import { Button } from '../ui/button';
import { AlertTriangle, BarChart2, Table, Download } from 'lucide-react';

interface ReportBuilderProps {
  onClose: () => void;
}

export function ReportBuilder({ onClose }: ReportBuilderProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState([]);
  const [visualization, setVisualization] = useState<'table' | 'line' | 'bar' | 'pie'>('table');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const report = await reportApi.createReport({
        name: 'Custom Report',
        metrics: selectedMetrics,
        dimensions: selectedDimensions,
        filters,
        dateRange
      });

      const data = await reportApi.runReport(report.id);
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run report');
      console.error('Error running report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Report Builder</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisualization(prev => 
              prev === 'table' ? 'line' : 
              prev === 'line' ? 'bar' : 
              prev === 'bar' ? 'pie' : 'table'
            )}
            disabled={!reportData}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            {visualization === 'table' ? 'Line Chart' :
             visualization === 'line' ? 'Bar Chart' :
             visualization === 'bar' ? 'Pie Chart' : 'Table'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!reportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <MetricSelector
            selectedMetrics={selectedMetrics}
            onChange={setSelectedMetrics}
          />
          <DimensionSelector
            selectedDimensions={selectedDimensions}
            onChange={setSelectedDimensions}
          />
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <FilterBuilder
            filters={filters}
            onChange={setFilters}
            metrics={selectedMetrics}
            dimensions={selectedDimensions}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleRunReport}
              disabled={loading || selectedMetrics.length === 0}
            >
              {loading ? 'Running...' : 'Run Report'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {reportData ? (
            visualization === 'table' ? (
              <DataGrid data={reportData} />
            ) : (
              <ChartBuilder
                data={reportData}
                type={visualization}
                metrics={selectedMetrics}
                dimensions={selectedDimensions}
              />
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select metrics and dimensions, then click "Run Report" to see your data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}