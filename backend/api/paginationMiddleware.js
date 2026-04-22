// backend/api/paginationMiddleware.js

/**
 * Middleware to handle pagination parameters
 */
function paginationMiddleware(req, res, next) {
  // Extract pagination parameters from query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const searchQuery = req.query.searchQuery || '';
  const sortBy = req.query.sortBy || '';
  const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
  
  // Validate parameters
  if (isNaN(page) || page < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Invalid limit. Must be between 1 and 100' });
  }
  
  // Parse filters from query parameters
  const filters = {};
  Object.keys(req.query).forEach(key => {
    if (!['page', 'limit', 'searchQuery', 'sortBy', 'sortOrder'].includes(key)) {
      filters[key] = req.query[key];
    }
  });
  
  // Attach pagination parameters to request object
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
    searchQuery,
    sortBy,
    sortOrder,
    filters
  };
  
  next();
}

/**
 * Builds a SQL query with pagination, search, and filtering
 */
function buildPaginatedQuery(baseQuery, paginationParams, tableName, searchableFields = []) {
  let query = baseQuery;
  const params = [];
  let paramIndex = 1;
  
  // Add search condition if search query exists
  if (paginationParams.searchQuery) {
    if (searchableFields.length > 0) {
      const searchConditions = searchableFields.map(field => {
        params.push(`%${paginationParams.searchQuery}%`);
        return `${field} ILIKE $${paramIndex++}`;
      }).join(' OR ');
      
      query += ` WHERE (${searchConditions})`;
    }
  }
  
  // Add filter conditions
  const filterKeys = Object.keys(paginationParams.filters);
  if (filterKeys.length > 0) {
    const filterConditions = [];
    
    filterKeys.forEach(key => {
      const value = paginationParams.filters[key];
      
      if (value !== undefined && value !== null && value !== '') {
        // Handle array values (for multi-select filters)
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          filterConditions.push(`${key} = ANY(ARRAY[${placeholders}])`);
          params.push(...value);
        } else {
          // Handle range filters (e.g., min/max values)
          if (typeof value === 'object' && value.hasOwnProperty('min') && value.hasOwnProperty('max')) {
            filterConditions.push(`${key} BETWEEN $${paramIndex++} AND $${paramIndex++}`);
            params.push(value.min, value.max);
          } else {
            filterConditions.push(`${key} = $${paramIndex++}`);
            params.push(value);
          }
        }
      }
    });
    
    if (searchableFields.length > 0 && paginationParams.searchQuery) {
      query += ` AND `;
    } else {
      query += ` WHERE `;
    }
    
    query += filterConditions.join(' AND ');
  }
  
  // Add sorting
  if (paginationParams.sortBy) {
    query += ` ORDER BY ${paginationParams.sortBy} ${paginationParams.sortOrder.toUpperCase()}`;
  }
  
  // Add pagination
  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(paginationParams.limit, paginationParams.offset);
  
  return { query, params };
}

/**
 * Executes a paginated query and returns results with metadata
 */
async function executePaginatedQuery(client, baseQuery, countQuery, paginationParams, tableName, searchableFields = []) {
  try {
    // Get total count
    const countResult = await client.query(countQuery);
    const totalCount = countResult.rows[0].count;
    
    // Build and execute paginated query
    const { query, params } = buildPaginatedQuery(
      baseQuery, 
      paginationParams, 
      tableName, 
      searchableFields
    );
    
    const result = await client.query(query, params);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / paginationParams.limit);
    const currentPage = paginationParams.page;
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    
    return {
      data: result.rows,
      totalCount,
      currentPage,
      totalPages,
      hasNextPage,
      hasPrevPage
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  paginationMiddleware,
  buildPaginatedQuery,
  executePaginatedQuery
};