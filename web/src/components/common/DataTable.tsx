import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Database, Plus } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface ServerPaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  onAddClick?: () => void;
  addLabel?: string;
  actions?: (row: T) => React.ReactNode;
  filterSlot?: React.ReactNode;
  headerAction?: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  serverPagination?: ServerPaginationConfig;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = 'Search records...',
  onAddClick,
  addLabel = 'Add Record',
  actions,
  filterSlot,
  headerAction,
  title,
  subtitle,
  showHeader = true,
  selectable = false,
  onSelectionChange,
  serverPagination,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Filter Data
  const filteredData = useMemo(() => {
    if (serverPagination) return data;
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm, serverPagination]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginate Data
  const totalPages = serverPagination
    ? serverPagination.totalPages || 1
    : Math.ceil(sortedData.length / pageSize) || 1;

  const paginatedData = useMemo(() => {
    if (serverPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, serverPagination]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
      if (onSelectionChange) onSelectionChange([]);
    } else {
      const ids = new Set(paginatedData.map((d, i) => d.id || i));
      setSelectedIds(ids);
      if (onSelectionChange) onSelectionChange(paginatedData);
    }
  };

  const toggleSelectRow = (row: T, index: number) => {
    const id = row.id || index;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    if (onSelectionChange) {
      onSelectionChange(paginatedData.filter((d, i) => next.has(d.id || i)));
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Table Header Controls */}
      {showHeader && (
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/90 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20 shadow-xs flex-shrink-0">
              <Database size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                {title && <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>}
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px] whitespace-nowrap">
                  {(serverPagination ? serverPagination.total : data.length).toLocaleString()}{' '}
                  {(serverPagination ? serverPagination.total : data.length) === 1 ? 'record' : 'records'}
                </span>
              </div>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Right Controls Bar: Filters, Search, Header Action, Add Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {filterSlot}

            {/* Search Input */}
            <div className="relative flex-1 sm:w-48 min-w-[150px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {headerAction}

            {/* Add Action Button */}
            {onAddClick && (
              <button
                onClick={onAddClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Plus size={15} />
                <span>{addLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-white uppercase tracking-wider text-[11px] font-bold">
              {selectable && (
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === paginatedData.length}
                    onChange={toggleSelectAll}
                    className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 accent-indigo-600 dark:accent-indigo-500 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-5 py-3.5 font-bold ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown size={12} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
              {actions && <th className="px-5 py-3.5 text-right font-bold">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: serverPagination ? Math.min(serverPagination.limit, 10) : pageSize }).map((_, i) => (
                <tr key={i} className={`animate-pulse border-b border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50 dark:bg-slate-800/30'}`}>
                  {selectable && <td className="p-4"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></td>}
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700/70 rounded w-3/4" />
                    </td>
                  ))}
                  {actions && <td className="px-5 py-4 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-700/70 rounded w-12 ml-auto" /></td>}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)} className="p-12 text-center text-slate-400 dark:text-slate-500">
                  <Database size={32} className="mx-auto mb-2 opacity-40 text-indigo-400" />
                  <p className="font-medium">No records found</p>
                  {searchTerm && <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">Try clearing your search query</p>}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowId = row.id || idx;
                const isSelected = selectedIds.has(rowId);
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={rowId}
                    className={`border-b border-slate-100 dark:border-slate-800/60 transition-colors group ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-600/10'
                        : isEven
                        ? 'bg-white dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-slate-700/30'
                        : 'bg-slate-50/70 dark:bg-slate-800/25 hover:bg-indigo-50/50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    {selectable && (
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row, idx)}
                          className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 accent-indigo-600 dark:accent-indigo-500 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-4 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row, idx) : row[col.key] ?? '—'}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs bg-slate-50/90 dark:bg-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Show</span>
          <select
            value={serverPagination ? serverPagination.limit : pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              if (serverPagination) {
                serverPagination.onLimitChange?.(newSize);
              } else {
                setPageSize(newSize);
                setCurrentPage(1);
              }
            }}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 font-semibold text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            entries ({(serverPagination ? serverPagination.total : sortedData.length).toLocaleString()} total)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-2 text-slate-600 dark:text-slate-400 font-medium">
            Page <strong className="text-slate-900 dark:text-white font-bold">{serverPagination ? serverPagination.page : currentPage}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {serverPagination ? serverPagination.totalPages || 1 : totalPages}
            </strong>
          </span>
          <button
            onClick={() => {
              if (serverPagination) {
                serverPagination.onPageChange(Math.max(1, serverPagination.page - 1));
              } else {
                setCurrentPage((p) => Math.max(1, p - 1));
              }
            }}
            disabled={serverPagination ? serverPagination.page <= 1 : currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              if (serverPagination) {
                serverPagination.onPageChange(Math.min(serverPagination.totalPages, serverPagination.page + 1));
              } else {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }
            }}
            disabled={
              serverPagination
                ? serverPagination.page >= (serverPagination.totalPages || 1)
                : currentPage === totalPages
            }
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
