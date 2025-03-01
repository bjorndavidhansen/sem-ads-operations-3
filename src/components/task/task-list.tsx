import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, ChevronRight, Search, Filter, Download, FileJson, FileSpreadsheet, Table, Settings } from 'lucide-react';
import { taskApi, type AutomationTask } from '../../lib/task-api';
import { exportToCsv, exportToJson, exportToExcel, exportToGoogleSheets, type ExportFormat, type DateTimeFormat, type ExportOptions } from '../../lib/export-utils';
import { TaskDetails } from './task-details';
import { Button } from '../ui/button';

const TASK_TYPES = [
  { value: 'COPY_CAMPAIGN', label: 'Copy Campaign' },
  { value: 'CONVERT_MATCH_TYPES', label: 'Match Type Conversion' },
  { value: 'CREATE_BSP', label: 'Create Bidding Strategy' }
] as const;

const TASK_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' }
] as const;

const EXPORT_OPTIONS = [
  { value: 'csv', label: 'CSV', icon: Table },
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
  { value: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet }
] as const;

const DATE_FORMAT_OPTIONS = [
  { value: 'short', label: 'Short (e.g., 1/1/2025, 9:00 AM)' },
  { value: 'medium', label: 'Medium (e.g., Jan 1, 2025, 9:00:00 AM)' },
  { value: 'long', label: 'Long (e.g., January 1, 2025 at 9:00:00 AM GMT)' },
  { value: 'iso', label: 'ISO (e.g., 2025-01-01T09:00:00Z)' },
  { value: 'relative', label: 'Relative (e.g., 2h ago)' }
] as const;

interface ColumnSettings {
  key: string;
  label: string;
  visible: boolean;
  format: {
    type: 'date' | 'duration' | 'text' | 'status';
    format?: DateTimeFormat;
    width?: number;
    align?: 'left' | 'center' | 'right';
  };
}

const DEFAULT_COLUMN_SETTINGS: ColumnSettings[] = [
  { key: 'id', label: 'Task ID', visible: true, format: { type: 'text', align: 'left', width: 15 } },
  { key: 'type', label: 'Type', visible: true, format: { type: 'text', align: 'left', width: 12 } },
  { key: 'status', label: 'Status', visible: true, format: { type: 'status', align: 'center', width: 10 } },
  { key: 'startTime', label: 'Start Time', visible: true, format: { type: 'date', format: 'medium', align: 'left', width: 20 } },
  { key: 'endTime', label: 'End Time', visible: true, format: { type: 'date', format: 'medium', align: 'left', width: 20 } },
  { key: 'duration', label: 'Duration', visible: true, format: { type: 'duration', align: 'right', width: 10 } },
  { key: 'errorMessage', label: 'Error', visible: true, format: { type: 'text', align: 'left', width: 30 } }
];

export function TaskList() {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AutomationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<AutomationTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<AutomationTask['type']>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<AutomationTask['status']>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateFormatSettings, setShowDateFormatSettings] = useState(false);
  const [dateFormat, setDateFormat] = useState<DateTimeFormat>('medium');
  const [use24HourTime, setUse24HourTime] = useState(true);
  const [includeMilliseconds, setIncludeMilliseconds] = useState(false);
  const [selectedTimeZone, setSelectedTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>(DEFAULT_COLUMN_SETTINGS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, selectedTypes, selectedStatuses, dateRange]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.listTasks();
      setTasks(data);
      setFilteredTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.id.toLowerCase().includes(query) ||
        JSON.stringify(task.requestPayload).toLowerCase().includes(query) ||
        (task.resultPayload && JSON.stringify(task.resultPayload).toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(task => selectedTypes.has(task.type));
    }

    // Apply status filter
    if (selectedStatuses.size > 0) {
      filtered = filtered.filter(task => selectedStatuses.has(task.status));
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(task => 
        new Date(task.startTime) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(task => 
        new Date(task.startTime) <= new Date(dateRange.end)
      );
    }

    setFilteredTasks(filtered);
  };

  const toggleType = (type: AutomationTask['type']) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const toggleStatus = (status: AutomationTask['status']) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes(new Set());
    setSelectedStatuses(new Set());
    setDateRange({ start: '', end: '' });
  };

  const handleExport = (format: ExportFormat) => {
    const filename = `task-history-${new Date().toISOString().split('T')[0]}`;
    
    const exportOptions: ExportOptions = {
      columns: columnSettings
        .filter(col => col.visible)
        .map(({ key, label, format }) => ({
          key,
          label,
          format
        })),
      dateFormat,
      use24HourTime,
      includeMilliseconds,
      timeZone: selectedTimeZone
    };
    
    switch (format) {
      case 'csv':
        exportToCsv(filteredTasks, filename, exportOptions);
        break;
      case 'json':
        exportToJson(filteredTasks, filename, exportOptions);
        break;
      case 'xlsx':
        exportToExcel(filteredTasks, filename, exportOptions);
        break;
      case 'sheets':
        exportToGoogleSheets(filteredTasks, exportOptions);
        break;
    }
    
    setShowExportMenu(false);
  };

  const getStatusIcon = (status: AutomationTask['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'RUNNING':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getTaskTypeLabel = (type: AutomationTask['type']) => {
    return TASK_TYPES.find(t => t.value === type)?.label || type;
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Task History</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={filteredTasks.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu">
                  {EXPORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleExport(value)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      role="menuitem"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        setShowColumnSettings(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      role="menuitem"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Column Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {showColumnSettings && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Column Settings</h3>
            
            <div className="space-y-4">
              {columnSettings.map((column, index) => (
                <div key={column.key} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={(e) => {
                        const newSettings = [...columnSettings];
                        newSettings[index] = {
                          ...column,
                          visible: e.target.checked
                        };
                        setColumnSettings(newSettings);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{column.label}</span>
                  </div>

                  {column.format.type === 'date' && (
                    <select
                      value={column.format.format}
                      onChange={(e) => {
                        const newSettings = [...columnSettings];
                        newSettings[index] = {
                          ...column,
                          format: {
                            ...column.format,
                            format: e.target.value as DateTimeFormat
                          }
                        };
                        setColumnSettings(newSettings);
                      }}
                      className="ml-4 text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    >
                      {DATE_FORMAT_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setColumnSettings(DEFAULT_COLUMN_SETTINGS);
                  setShowColumnSettings(false);
                }}
              >
                Reset to Default
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowColumnSettings(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDateFormatSettings && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Date Format Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value as DateTimeFormat)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {DATE_FORMAT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select
                  value={selectedTimeZone}
                  onChange={(e) => setSelectedTimeZone(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {Intl.supportedValuesOf('timeZone').map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="use24HourTime"
                  checked={use24HourTime}
                  onChange={(e) => setUse24HourTime(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="use24HourTime" className="ml-2 text-sm text-gray-900">
                  Use 24-hour time format
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeMilliseconds"
                  checked={includeMilliseconds}
                  onChange={(e) => setIncludeMilliseconds(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="includeMilliseconds" className="ml-2 text-sm text-gray-900">
                  Include milliseconds (ISO format only)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDateFormatSettings(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

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

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type
                </label>
                <div className="space-y-2">
                  {TASK_TYPES.map(({ value, label }) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.has(value)}
                        onChange={() => toggleType(value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {TASK_STATUSES.map(({ value, label }) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.has(value)}
                        onChange={() => toggleStatus(value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedTask?.id === task.id ? 'bg-gray-50' : ''
                }`}
                onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(task.status)}
                      <p className="ml-3 text-sm font-medium text-gray-900">
                        {getTaskTypeLabel(task.type)}
                      </p>
                      <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        task.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        task.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-500">
                        {new Date(task.startTime).toLocaleString()}
                      </p>
                      <ChevronRight className={`ml-2 h-5 w-5 text-gray-400 transform transition-transform ${
                        selectedTask?.id === task.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                  {selectedTask?.id === task.id && (
                    <TaskDetails taskId={task.id} />
                  )}
                </div>
              </li>
            ))}
            {filteredTasks.length === 0 && (
              <li className="px-4 py-8 text-center">
                <Clock className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  {tasks.length === 0 ? 'No tasks found' : 'No tasks match the current filters'}
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}