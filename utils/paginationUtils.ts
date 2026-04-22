// utils/paginationUtils.ts

export interface PaginationParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Applies pagination, sorting, and filtering to an array of data
 * This is a client-side implementation that would be replaced by server-side logic
 */
export function applyPaginationAndFilters<T>(
  data: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;

  // Apply search query if provided
  let filteredData = [...data];
  if (params.searchQuery) {
    const searchLower = params.searchQuery.toLowerCase();
    filteredData = filteredData.filter(item => {
      // Generic search across all string properties
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchLower);
        }
        return false;
      });
    });
  }

  // Apply additional filters if provided
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filteredData = filteredData.filter(item => {
          const itemValue = getNestedProperty(item, key);
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          } else if (typeof value === 'string' && typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          } else {
            return itemValue === value;
          }
        });
      }
    });
  }

  // Apply sorting
  if (params.sortBy) {
    filteredData.sort((a, b) => {
      const aValue = getNestedProperty(a, params.sortBy!);
      const bValue = getNestedProperty(b, params.sortBy!);
      
      // Handle different data types for comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return params.sortOrder === 'desc' ? -result : result;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return params.sortOrder === 'desc' ? -result : result;
      } else {
        // Convert to string for comparison
        const result = String(aValue).localeCompare(String(bValue));
        return params.sortOrder === 'desc' ? -result : result;
      }
    });
  }

  // Apply pagination
  const paginatedData = filteredData.slice(offset, offset + limit);
  
  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data: paginatedData,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage
  };
}

/**
 * Helper function to get nested property values using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}