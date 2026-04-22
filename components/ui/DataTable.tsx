// components/ui/DataTable.tsx
import React from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

const DataTable = <T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'لا توجد بيانات',
  className = '',
  striped = true,
  hoverable = true
}: DataTableProps<T>) => {
  if (data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 font-bold">{emptyMessage}</p>
      </div>
    );
  }

  const getValue = (item: T, key: string) => {
    const keys = key.split('.');
    let value: any = item;
    for (const k of keys) {
      value = value?.[k as keyof typeof value];
    }
    return value;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-100">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`text-right py-4 px-4 font-black text-gray-500 text-xs uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr
              key={item.id || rowIndex}
              className={`
                ${striped && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                ${hoverable && onRowClick ? 'hover:bg-emerald-50 cursor-pointer transition-colors' : ''}
                border-b border-gray-50 last:border-b-0
              `}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`py-4 px-4 text-sm ${column.className || ''}`}
                >
                  {column.render
                    ? column.render(item, rowIndex)
                    : getValue(item, column.key as string)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
