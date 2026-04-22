// components/DataTable.tsx
import React, { useState, useEffect } from 'react';
import { PaginationParams, applyPaginationAndFilters, PaginatedResult } from '../utils/paginationUtils';

interface ColumnConfig<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  serverSide?: boolean;
  fetchData?: (params: PaginationParams) => Promise<PaginatedResult<T>>;
  initialPageSize?: number;
  searchableFields?: string[];
  filterConfig?: Record<string, { label: string; type: 'select' | 'input' | 'date'; options?: { value: string; label: string }[] }>;
  onRowClick?: (record: T) => void;
}

function DataTable<T>({
  data,
  columns,
  serverSide = false,
  fetchData,
  initialPageSize = 10,
  searchableFields = [],
  filterConfig = {},
  onRowClick
}: DataTableProps<T>) {
  // Client-side pagination state
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(initialPageSize);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSortBy, setClientSortBy] = useState<string | null>(null);
  const [clientSortOrder, setClientSortOrder] = useState<'asc' | 'desc'>('asc');
  const [clientFilters, setClientFilters] = useState<Record<string, any>>({});

  // Server-side pagination state
  const [serverPage, setServerPage] = useState(1);
  const [serverPageSize, setServerPageSize] = useState(initialPageSize);
  const [serverSearchQuery, setServerSearchQuery] = useState('');
  const [serverSortBy, setServerSortBy] = useState<string | null>(null);
  const [serverSortOrder, setServerSortOrder] = useState<'asc' | 'desc'>('asc');
  const [serverFilters, setServerFilters] = useState<Record<string, any>>({});
  const [serverData, setServerData] = useState<T[]>([]);
  const [totalServerRecords, setTotalServerRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPageData, setCurrentPageData] = useState<T[]>([]);

  // Handle client-side pagination
  useEffect(() => {
    if (!serverSide) {
      const params: PaginationParams = {
        page: clientPage,
        limit: clientPageSize,
        searchQuery: clientSearchQuery,
        sortBy: clientSortBy || undefined,
        sortOrder: clientSortOrder,
        filters: clientFilters
      };

      const result = applyPaginationAndFilters(data, params);
      setCurrentPageData(result.data);
    }
  }, [data, clientPage, clientPageSize, clientSearchQuery, clientSortBy, clientSortOrder, clientFilters, serverSide]);

  // Handle server-side pagination
  useEffect(() => {
    if (serverSide && fetchData) {
      const fetchServerData = async () => {
        setLoading(true);
        try {
          const params: PaginationParams = {
            page: serverPage,
            limit: serverPageSize,
            searchQuery: serverSearchQuery,
            sortBy: serverSortBy || undefined,
            sortOrder: serverSortOrder,
            filters: serverFilters
          };

          const result = await fetchData(params);
          setServerData(result.data);
          setTotalServerRecords(result.totalCount);
          setCurrentPageData(result.data);
        } catch (error) {
          console.error('Error fetching server data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchServerData();
    }
  }, [serverSide, fetchData, serverPage, serverPageSize, serverSearchQuery, serverSortBy, serverSortOrder, serverFilters]);

  // Determine which data to use
  const displayData = serverSide ? serverData : currentPageData;
  const totalRecords = serverSide ? totalServerRecords : applyPaginationAndFilters(data, {}).totalCount;

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalRecords / (serverSide ? serverPageSize : clientPageSize));
  const currentPage = serverSide ? serverPage : clientPage;
  const pageSize = serverSide ? serverPageSize : clientPageSize;

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (serverSide) {
      if (serverSortBy === columnKey) {
        setServerSortOrder(serverSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setServerSortBy(columnKey);
        setServerSortOrder('asc');
      }
      setServerPage(1); // Reset to first page when sorting changes
    } else {
      if (clientSortBy === columnKey) {
        setClientSortOrder(clientSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setClientSortBy(columnKey);
        setClientSortOrder('asc');
      }
      setClientPage(1); // Reset to first page when sorting changes
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (serverSide) {
      setServerPage(Math.max(1, Math.min(newPage, totalPages)));
    } else {
      setClientPage(Math.max(1, Math.min(newPage, totalPages)));
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    if (serverSide) {
      setServerPageSize(newPageSize);
      setServerPage(1); // Reset to first page when page size changes
    } else {
      setClientPageSize(newPageSize);
      setClientPage(1); // Reset to first page when page size changes
    }
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    if (serverSide) {
      setServerSearchQuery(searchTerm);
      setServerPage(1); // Reset to first page when search changes
    } else {
      setClientSearchQuery(searchTerm);
      setClientPage(1); // Reset to first page when search changes
    }
  };

  // Handle filter change
  const handleFilterChange = (filterKey: string, value: any) => {
    if (serverSide) {
      setServerFilters(prev => ({ ...prev, [filterKey]: value }));
      setServerPage(1); // Reset to first page when filter changes
    } else {
      setClientFilters(prev => ({ ...prev, [filterKey]: value }));
      setClientPage(1); // Reset to first page when filter changes
    }
  };

  // Render sort indicator
  const renderSortIndicator = (columnKey: string) => {
    const isSorted = (serverSide ? serverSortBy : clientSortBy) === columnKey;
    const isAsc = (serverSide ? serverSortOrder : clientSortOrder) === 'asc';

    if (!isSorted) return null;

    return (
      <span className="ml-1">
        {isAsc ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="بحث..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={serverSide ? serverSearchQuery : clientSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        {Object.entries(filterConfig).map(([key, config]) => (
          <div key={key} className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{config.label}</label>
            {config.type === 'select' ? (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={serverSide ? serverFilters[key] || '' : clientFilters[key] || ''}
                onChange={(e) => handleFilterChange(key, e.target.value)}
              >
                <option value="">الكل</option>
                {config.options?.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : config.type === 'date' ? (
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={serverSide ? serverFilters[key] || '' : clientFilters[key] || ''}
                onChange={(e) => handleFilterChange(key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={serverSide ? serverFilters[key] || '' : clientFilters[key] || ''}
                onChange={(e) => handleFilterChange(key, e.target.value)}
                placeholder={`تصفية حسب ${config.label}`}
              />
            )}
          </div>
        ))}

        {/* Page Size Selector */}
        <div className="min-w-[120px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">عدد السجلات</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center justify-end">
                    {column.title}
                    {column.sortable && renderSortIndicator(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  لا توجد بيانات متاحة
                </td>
              </tr>
            ) : (
              displayData.map((record, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 cursor-pointer ${onRowClick ? 'cursor-pointer hover:bg-emerald-50' : ''}`}
                  onClick={() => onRowClick && onRowClick(record)}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      {column.render 
                        ? column.render((record as any)[column.key], record) 
                        : String((record as any)[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
        <div className="text-sm text-gray-700 mb-2 sm:mb-0">
          عرض <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, totalRecords)}</span> إلى{' '}
          <span className="font-medium">
            {Math.min(currentPage * pageSize, totalRecords)}
          </span>{' '}
          من <span className="font-medium">{totalRecords}</span> سجل
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            السابق
          </button>
          
          <span className="text-sm text-gray-700 mx-2">
            {currentPage} من {totalPages || 1}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === totalPages || totalPages === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;