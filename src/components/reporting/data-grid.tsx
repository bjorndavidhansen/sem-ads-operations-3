import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';

interface DataGridProps {
  data: {
    dimensions: Record<string, string[]>;
    metrics: Record<string, number[]>;
    totals?: Record<string, number>;
  };
  pageSize?: number;
}

export function DataGrid({ data, pageSize = 10 }: DataGridProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Get all columns (dimensions + metrics)
  const columns = [
    ...Object.keys(data.dimensions),
    ...Object.keys(data.metrics)
  ];

  // Create rows by combining dimension and metric values
  const rows = columns[0] ? Array.from(
    { length: data.dimensions[Object.keys(data.dimensions)[0]].length },
    (_, i) => ({
      ...Object.keys(data.dimensions).reduce((acc, key) => ({
        ...acc,
        [key]: data.dimensions[key][i]
      }), {}),
      ...Object.keys(data.metrics).reduce((acc, key) => ({
        ...acc,
        [key]: data.metrics[key][i]
      }), {})
    })
  ) : [];

  // Sort rows if a sort column is selected
  const sortedRows = sortColumn
    ? [...rows].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        const multiplier = sortDirection === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * multiplier;
        }

        return String(aValue).localeCompare(String(bValue)) * multiplier;
      })
    : rows;

  // Calculate pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedRows.length);
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatValue = (value: any, column: string) => {
    if (typeof value === 'number') {
      if (column.includes('rate') || column.includes('percentage')) {
        return `${value.toFixed(2)}%`;
      }
      if (column.includes('cost') || column.includes('value')) {
        return `$${value.toFixed(2)}`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const formatColumnHeader = (column: string) => {
    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {formatColumnHeader(column)}
                    {sortColumn === column && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      typeof row[column] === 'number' ? 'text-right' : 'text-left'
                    } ${
                      Object.keys(data.metrics).includes(column)
                        ? 'font-medium text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatValue(row[column], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {data.totals && (
            <tfoot className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <td
                    key={column}
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      typeof data.totals?.[column] === 'number' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {data.totals[column] !== undefined
                      ? formatValue(data.totals[column], column)
                      : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {startIndex + 1} to {endIndex} of {rows.length} results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}