export interface FilterCriteria {
  [field: string]: any;
}

export interface RangeFilter {
  min?: number | Date | string;
  max?: number | Date | string;
}

export interface QueryFilterOptions {
  table: string;
  selectColumns?: string[];
  filters?: Record<string, any | any[] | RangeFilter>;
  searchField?: string;
  searchQuery?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  limit?: number;
  cursor?: { id: string | number; value: any };
}

export interface BuiltQuery {
  sql: string;
  params: any[];
}

/**
 * High-performance SQL Filter Query Builder for PostgreSQL.
 * Constructs parameterized, index-friendly queries with cursor pagination.
 */
export class FilterQueryBuilder {
  static buildSelectQuery(options: QueryFilterOptions): BuiltQuery {
    const {
      table,
      selectColumns = ['*'],
      filters = {},
      searchField,
      searchQuery,
      orderBy = 'id',
      orderDirection = 'DESC',
      limit = 50,
      cursor,
    } = options;

    const quotedTable = `"${table}"`;
    const selectedCols = selectColumns.map((c) => (c === '*' ? '*' : `"${c}"`)).join(', ');

    const whereConditions: string[] = [];
    const params: any[] = [];

    // 1. Process filters
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (val === undefined || val === null || val === '') return;

      const quotedCol = `"${key}"`;

      // Array multi-select (e.g. boothNumbers: [1, 2, 5])
      if (Array.isArray(val)) {
        if (val.length > 0) {
          params.push(val);
          whereConditions.push(`${quotedCol} = ANY($${params.length})`);
        }
      }
      // Range filter (e.g. age: { min: 18, max: 30 })
      else if (typeof val === 'object' && ('min' in val || 'max' in val)) {
        if (val.min !== undefined && val.min !== null) {
          params.push(val.min);
          whereConditions.push(`${quotedCol} >= $${params.length}`);
        }
        if (val.max !== undefined && val.max !== null) {
          params.push(val.max);
          whereConditions.push(`${quotedCol} <= $${params.length}`);
        }
      }
      // Exact match
      else {
        params.push(val);
        whereConditions.push(`${quotedCol} = $${params.length}`);
      }
    });

    // 2. Process Fuzzy / Trigram text search
    if (searchField && searchQuery && searchQuery.trim().length > 0) {
      params.push(`%${searchQuery.trim()}%`);
      whereConditions.push(`"${searchField}" ILIKE $${params.length}`);
    }

    // 3. Process Keyset / Cursor Pagination (O(1) constant speed)
    if (cursor) {
      const operator = orderDirection === 'DESC' ? '<' : '>';
      params.push(cursor.value);
      const valParamIdx = params.length;

      params.push(cursor.id);
      const idParamIdx = params.length;

      whereConditions.push(
        `("${orderBy}", "id") ${operator} ($${valParamIdx}, $${idParamIdx})`
      );
    }

    // Construct SQL WHERE clause
    const whereClause =
      whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    // Construct SQL ORDER BY clause
    const orderClause = ` ORDER BY "${orderBy}" ${orderDirection}, "id" ${orderDirection}`;

    // Limit clause
    params.push(Math.min(limit, 500));
    const limitClause = ` LIMIT $${params.length}`;

    const sql = `SELECT ${selectedCols} FROM ${quotedTable}${whereClause}${orderClause}${limitClause}`;

    return { sql, params };
  }
}
