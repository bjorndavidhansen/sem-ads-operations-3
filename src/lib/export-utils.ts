import { utils, write } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AutomationTask } from './task-api';

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'sheets' | 'pdf';

export type DateTimeFormat = 'short' | 'medium' | 'long' | 'iso' | 'relative';

interface ColumnFormat {
  type: 'date' | 'duration' | 'text' | 'status' | 'number' | 'currency';
  format?: DateTimeFormat;
  width?: number;
  align?: 'left' | 'center' | 'right';
  precision?: number;
  currency?: string;
}

interface ExportColumn {
  key: string;
  label: string;
  format: ColumnFormat;
}

export interface ExportOptions {
  columns?: ExportColumn[];
  dateFormat?: DateTimeFormat;
  includeMilliseconds?: boolean;
  use24HourTime?: boolean;
  timeZone?: string;
  title?: string;
  subtitle?: string;
  showTotals?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'LETTER';
  headerColor?: string;
  alternateRowColor?: string;
  logo?: {
    url: string;
    width: number;
    height: number;
  };
  filters?: {
    name: string;
    value: string;
  }[];
}

const DEFAULT_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'Task ID', format: { type: 'text', align: 'left' } },
  { key: 'type', label: 'Type', format: { type: 'text', align: 'left' } },
  { key: 'status', label: 'Status', format: { type: 'status', align: 'center' } },
  { key: 'startTime', label: 'Start Time', format: { type: 'date', format: 'medium', align: 'left' } },
  { key: 'endTime', label: 'End Time', format: { type: 'date', format: 'medium', align: 'left' } },
  { key: 'duration', label: 'Duration', format: { type: 'duration', align: 'right' } },
  { key: 'errorMessage', label: 'Error', format: { type: 'text', align: 'left' } }
];

function formatDateTime(date: Date, format: DateTimeFormat, options: ExportOptions): string {
  const { includeMilliseconds = false, use24HourTime = true, timeZone } = options;

  switch (format) {
    case 'short':
      return date.toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
        hour12: !use24HourTime,
        timeZone
      });

    case 'medium':
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'medium',
        hour12: !use24HourTime,
        timeZone
      });

    case 'long':
      return date.toLocaleString(undefined, {
        dateStyle: 'long',
        timeStyle: 'long',
        hour12: !use24HourTime,
        timeZone
      });

    case 'iso':
      const isoString = date.toISOString();
      return includeMilliseconds ? isoString : isoString.split('.')[0] + 'Z';

    case 'relative':
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;

    default:
      return date.toISOString();
  }
}

function formatDuration(startTime: Date, endTime: Date | null): string {
  if (!endTime) return '';

  const durationMs = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(durationMs / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatNumber(value: number, precision: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(value);
}

function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatValue(value: any, column: ExportColumn, task: AutomationTask, options: ExportOptions): string {
  if (value === null || value === undefined) return '';

  switch (column.format.type) {
    case 'date':
      if (!(value instanceof Date)) {
        value = new Date(value);
      }
      return formatDateTime(value, column.format.format || options.dateFormat || 'medium', options);

    case 'duration':
      if (column.key === 'duration') {
        const startTime = new Date(task.startTime);
        const endTime = task.endTime ? new Date(task.endTime) : null;
        return formatDuration(startTime, endTime);
      }
      return value.toString();

    case 'status':
      return formatStatus(value);

    case 'number':
      return formatNumber(value, column.format.precision);
    
    case 'currency':
      return formatCurrency(value, column.format.currency);

    case 'text':
    default:
      return value.toString();
  }
}

function calculateTotals(data: any[], columns: ExportColumn[]): Record<string, string> {
  const totals: Record<string, any> = {};

  columns.forEach(column => {
    if (['number', 'currency'].includes(column.format.type)) {
      const sum = data.reduce((acc, row) => {
        const value = parseFloat(row[column.label]);
        return !isNaN(value) ? acc + value : acc;
      }, 0);

      totals[column.label] = column.format.type === 'currency'
        ? formatCurrency(sum, column.format.currency)
        : formatNumber(sum, column.format.precision);
    } else {
      totals[column.label] = '';
    }
  });

  return totals;
}

function formatTaskData(tasks: AutomationTask[], options: ExportOptions = {}): Record<string, string>[] {
  const columns = options.columns || DEFAULT_COLUMNS;
  const rows = tasks.map(task => {
    const row: Record<string, string> = {};
    columns.forEach(column => {
      const value = task[column.key as keyof AutomationTask];
      row[column.label] = formatValue(value, column, task, options);
    });
    return row;
  });

  if (options.showTotals) {
    const totals = calculateTotals(rows, columns);
    rows.push(totals);
  }

  return rows;
}

export function exportToCsv(tasks: AutomationTask[], filename: string, options?: ExportOptions) {
  const data = formatTaskData(tasks, options);
  const headers = Object.keys(data[0]);
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => `"${row[header]}"`).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
}

export function exportToJson(tasks: AutomationTask[], filename: string, options?: ExportOptions) {
  const data = formatTaskData(tasks, options);
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadFile(blob, `${filename}.json`);
}

export function exportToExcel(tasks: AutomationTask[], filename: string, options?: ExportOptions) {
  const data = formatTaskData(tasks, options);
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();

  // Apply column formatting
  const columns = options?.columns || DEFAULT_COLUMNS;
  const colWidths: { wch: number }[] = [];
  const alignments: Record<string, string> = {};

  columns.forEach((column, index) => {
    // Set column width
    colWidths[index] = { wch: column.format.width || 12 };

    // Set alignment
    if (column.format.align) {
      alignments[utils.encode_col(index)] = column.format.align;
    }
  });

  worksheet['!cols'] = colWidths;

  // Apply cell styles
  for (let R = 0; R < data.length; R++) {
    for (let C = 0; C < columns.length; C++) {
      const cell = worksheet[utils.encode_cell({ r: R + 1, c: C })];
      if (!cell) continue;

      cell.s = {
        alignment: {
          horizontal: alignments[utils.encode_col(C)] || 'left',
          vertical: 'center'
        }
      };
    }
  }

  utils.book_append_sheet(workbook, worksheet, 'Tasks');
  
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadFile(blob, `${filename}.xlsx`);
}

export async function exportToGoogleSheets(tasks: AutomationTask[], options?: ExportOptions) {
  const data = formatTaskData(tasks, options);
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).map(value => `"${value}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  // Open Google Sheets import page in a new tab
  window.open(`https://docs.google.com/spreadsheets/d/1/import?format=csv&url=${encodeURIComponent(url)}`, '_blank');
}

export function exportToPdf(tasks: AutomationTask[], filename: string, options: ExportOptions = {}) {
  const {
    title = 'Report',
    subtitle,
    orientation = 'portrait',
    pageSize = 'A4',
    headerColor = '#f3f4f6',
    alternateRowColor = '#f9fafb',
    logo,
    filters
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });

  // Add logo if provided
  let startY = 20;
  if (logo) {
    doc.addImage(logo.url, 'PNG', 20, startY, logo.width, logo.height);
    startY += logo.height + 10;
  }

  // Add title and subtitle
  doc.setFontSize(20);
  doc.text(title, 20, startY);
  startY += 10;

  if (subtitle) {
    doc.setFontSize(12);
    doc.text(subtitle, 20, startY);
    startY += 10;
  }

  // Add filters if provided
  if (filters && filters.length > 0) {
    doc.setFontSize(10);
    filters.forEach(filter => {
      doc.text(`${filter.name}: ${filter.value}`, 20, startY);
      startY += 5;
    });
    startY += 5;
  }

  // Format data for the table
  const data = formatTaskData(tasks, options);
  const columns = options.columns || DEFAULT_COLUMNS;
  const headers = columns.map(col => col.label);
  const rows = data.map(row => columns.map(col => row[col.label]));

  // Add the table
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY,
    headStyles: {
      fillColor: headerColor,
      textColor: '#000000',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: alternateRowColor
    },
    columnStyles: columns.reduce((styles, col, index) => {
      styles[index] = {
        halign: col.format.align || 'left',
        cellWidth: col.format.width ? `${col.format.width}%` : 'auto'
      };
      return styles;
    }, {} as any),
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    didDrawPage: (data: any) => {
      // Add page number
      doc.setFontSize(8);
      doc.text(
        `Page ${data.pageNumber} of ${data.pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );

      // Add timestamp
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
  });

  // Save the PDF
  doc.save(`${filename}.pdf`);
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}