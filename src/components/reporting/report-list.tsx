import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Download, Play, Clock, AlertCircle, BarChart2, Table, FileJson, FileSpreadsheet, FileText, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { reportApi, type Report } from '../../lib/report-api';
import { ReportForm } from './report-form';
import { DataGrid } from './data-grid';
import { ChartBuilder } from './chart-builder';
import { exportToCsv, exportToJson, exportToExcel, exportToGoogleSheets, exportToPdf } from '../../lib/export-utils';

interface ReportListProps {
  onCreateNew: () => void;
}

type ExportFormat = 'csv' | 'json' | 'xlsx' | 'sheets' | 'pdf';

interface ExportOptions {
  dateFormat: 'medium' | 'short' | 'long';
  use24HourTime: boolean;
  includeMilliseconds: boolean;
  timeZone: string;
  showTotals?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
  headerColor?: string;
  alternateRowColor?: string;
  title?: string;
  subtitle?: string;
  filters?: Array<{ name: string; value: string }>;
}

export function ReportList({ onCreateNew }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [runningReport, setRunningReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [visualization, setVisualization] = useState<'table' | 'chart'>('table');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dateFormat: 'medium',
    use24HourTime: true,
    includeMilliseconds: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    showTotals: true,
    orientation: 'portrait',
    pageSize: 'A4',
    headerColor: '#f3f4f6',
    alternateRowColor: '#f9fafb'
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportApi.listReports();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReport = async (report: Report) => {
    try {
      setRunningReport(report.id);
      setError(null);
      const data = await reportApi.runReport(report.id);
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run report');
      console.error('Error running report:', err);
    } finally {
      setRunningReport(null);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!reportData) return;

    const filename = `report-${new Date().toISOString().split('T')[0]}`;
    
    // Enhance export options with report metadata
    const enhancedOptions: ExportOptions = {
      ...exportOptions,
      title: 'Google Ads Performance Report',
      subtitle: `Generated on ${new Date().toLocaleString()}`,
      filters: [
        { name: 'Date Range', value: `${reportData.dateRange.start} to ${reportData.dateRange.end}` },
        { name: 'Metrics', value: reportData.metrics.join(', ') },
        { name: 'Dimensions', value: reportData.dimensions.join(', ') }
      ]
    };

    switch (format) {
      case 'csv':
        exportToCsv(reportData, filename, enhancedOptions);
        break;
      case 'json':
        exportToJson(reportData, filename, enhancedOptions);
        break;
      case 'xlsx':
        exportToExcel(reportData, filename, enhancedOptions);
        break;
      case 'sheets':
        exportToGoogleSheets(reportData, enhancedOptions);
        break;
      case 'pdf':
        exportToPdf(reportData, filename, enhancedOptions);
        break;
    }

    setShowExportMenu(false);
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await reportApi.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
      console.error('Error deleting report:', err);
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {reports.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                    {report.description && (
                      <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>Metrics:</span>
                        {report.metrics.map((metric) => (
                          <span
                            key={metric}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {metric}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Dimensions:</span>
                        {report.dimensions.map((dimension) => (
                          <span
                            key={dimension}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {dimension}
                          </span>
                        ))}
                      </div>
                    </div>
                    {report.schedule && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>
                          Runs {report.schedule.frequency} at {report.schedule.time} ({report.schedule.timezone})
                        </span>
                      </div>
                    )}
                    {report.lastRun && (
                      <div className="mt-1 text-xs text-gray-500">
                        Last run: {new Date(report.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunReport(report)}
                      disabled={runningReport === report.id}
                    >
                      <Play className={`h-4 w-4 mr-2 ${runningReport === report.id ? 'animate-spin' : ''}`} />
                      Run Report
                    </Button>
                    <button
                      onClick={() => setEditingReport(report)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {editingReport?.id === report.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <ReportForm
                      report={report}
                      onSubmit={async (data) => {
                        try {
                          await reportApi.updateReport(report.id, data);
                          await loadReports();
                          setEditingReport(null);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to update report');
                          console.error('Error updating report:', err);
                        }
                      }}
                      onCancel={() => setEditingReport(null)}
                    />
                  </div>
                )}

                {reportData && runningReport === report.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Results</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVisualization(visualization === 'table' ? 'chart' : 'table')}
                        >
                          {visualization === 'table' ? (
                            <>
                              <BarChart2 className="h-4 w-4 mr-2" />
                              Show Chart
                            </>
                          ) : (
                            <>
                              <Table className="h-4 w-4 mr-2" />
                              Show Table
                            </>
                          )}
                        </Button>
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                          
                          {showExportMenu && (
                            <div className="absolute right-0 mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu">
                                <button
                                  onClick={() => handleExport('csv')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  role="menuitem"
                                >
                                  <Table className="h-4 w-4 mr-2" />
                                  Export as CSV
                                </button>
                                <button
                                  onClick={() => handleExport('json')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  role="menuitem"
                                >
                                  <FileJson className="h-4 w-4 mr-2" />
                                  Export as JSON
                                </button>
                                <button
                                  onClick={() => handleExport('xlsx')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  role="menuitem"
                                >
                                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                                  Export as Excel
                                </button>
                                <button
                                  onClick={() => handleExport('pdf')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  role="menuitem"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export as PDF
                                </button>
                                <button
                                  onClick={() => handleExport('sheets')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  role="menuitem"
                                >
                                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                                  Open in Google Sheets
                                </button>
                                <div className="border-t border-gray-100 mt-1 pt-1">
                                  <button
                                    onClick={() => setShowExportOptions(true)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    role="menuitem"
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Export Settings
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {visualization === 'table' ? (
                      <DataGrid data={reportData} />
                    ) : (
                      <ChartBuilder
                        data={reportData}
                        type="line"
                        metrics={report.metrics}
                        dimensions={report.dimensions}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports created</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first report.
            </p>
            <div className="mt-6">
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}